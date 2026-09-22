import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'taskdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
};

export const pool = new Pool(poolConfig);

// In-memory fallback dataset for seamless local testing if PostgreSQL connection fails
let inMemoryTasks = [
  {
    id: 1,
    title: 'Configurar servidor PostgreSQL 17',
    description: 'Instalar y validar la instancia local de PostgreSQL 17 con la base de datos taskdb.',
    status: 'completed',
    priority: 'high',
    category: 'DevOps',
    due_date: '2026-09-30',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    title: 'Desarrollar API REST con Express 5',
    description: 'Implementar rutas CRUD usando las últimas novedades de Express 5 y control de errores asíncrono.',
    status: 'in_progress',
    priority: 'high',
    category: 'Backend',
    due_date: '2026-10-05',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: 'Diseñar interfaz de usuario con React 19 y Vite',
    description: 'Construir Dashboard interactivo con tema glassmorphism y métricas en tiempo real.',
    status: 'pending',
    priority: 'medium',
    category: 'Frontend',
    due_date: '2026-10-10',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let nextMemoryId = 4;

let isPostgresConnected = false;

// Test initial database connection
pool.query('SELECT NOW()')
  .then(() => {
    isPostgresConnected = true;
    console.log(' Conectado exitosamente a PostgreSQL 17');
  })
  .catch((err) => {
    isPostgresConnected = false;
    console.warn('⚠️ No se pudo conectar a PostgreSQL local. Operando en modo In-Memory para desarrollo sin interrupciones.');
    console.warn(` Detalle: ${err.message}`);
  });

/**
 * Execute query against PostgreSQL pool, with automatic fallback to memory if offline.
 */
export async function query(text, params = []) {
  if (isPostgresConnected) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('Error en consulta SQL PostgreSQL:', err.message);
      throw err;
    }
  }

  // Pure JavaScript SQL Simulator for fallback
  return simulateQuery(text, params);
}

function simulateQuery(text, params) {
  const normalized = text.trim().toLowerCase();

  // SELECT ALL OR FILTERED
  if (normalized.startsWith('select * from tasks') || normalized.startsWith('select id, title')) {
    let result = [...inMemoryTasks];
    if (text.includes('WHERE status = $1')) {
      result = result.filter(t => t.status === params[0]);
    }
    // Simple sort
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: result, rowCount: result.length };
  }

  // SELECT BY ID
  if (normalized.startsWith('select * from tasks where id = $1')) {
    const item = inMemoryTasks.find(t => t.id === Number(params[0]));
    return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
  }

  // INSERT
  if (normalized.startsWith('insert into tasks')) {
    const newTask = {
      id: nextMemoryId++,
      title: params[0],
      description: params[1] || '',
      status: params[2] || 'pending',
      priority: params[3] || 'medium',
      category: params[4] || 'General',
      due_date: params[5] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryTasks.unshift(newTask);
    return { rows: [newTask], rowCount: 1 };
  }

  // UPDATE
  if (normalized.startsWith('update tasks')) {
    const id = Number(params[params.length - 1]);
    const index = inMemoryTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      inMemoryTasks[index] = {
        ...inMemoryTasks[index],
        title: params[0] !== undefined ? params[0] : inMemoryTasks[index].title,
        description: params[1] !== undefined ? params[1] : inMemoryTasks[index].description,
        status: params[2] !== undefined ? params[2] : inMemoryTasks[index].status,
        priority: params[3] !== undefined ? params[3] : inMemoryTasks[index].priority,
        category: params[4] !== undefined ? params[4] : inMemoryTasks[index].category,
        due_date: params[5] !== undefined ? params[5] : inMemoryTasks[index].due_date,
        updated_at: new Date().toISOString()
      };
      return { rows: [inMemoryTasks[index]], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // DELETE
  if (normalized.startsWith('delete from tasks')) {
    const id = Number(params[0]);
    const initialLen = inMemoryTasks.length;
    inMemoryTasks = inMemoryTasks.filter(t => t.id !== id);
    return { rowCount: initialLen - inMemoryTasks.length };
  }

  // STATS
  if (normalized.includes('count(')) {
    const total = inMemoryTasks.length;
    const pending = inMemoryTasks.filter(t => t.status === 'pending').length;
    const in_progress = inMemoryTasks.filter(t => t.status === 'in_progress').length;
    const completed = inMemoryTasks.filter(t => t.status === 'completed').length;
    return {
      rows: [{ total, pending, in_progress, completed }],
      rowCount: 1
    };
  }

  return { rows: [], rowCount: 0 };
}
