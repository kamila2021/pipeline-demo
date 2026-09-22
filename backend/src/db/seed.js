import { pool } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  console.log('🌱 Ejecutando seed de base de datos PostgreSQL 17...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Aplicando esquema SQL...');
    await pool.query(schemaSql);

    console.log('✏️ Insertando datos iniciales de prueba...');
    const seedQuery = `
      INSERT INTO tasks (title, description, status, priority, category, due_date) VALUES
      ('Configurar servidor PostgreSQL 17', 'Instalar y validar la instancia local de PostgreSQL 17 con la base de datos taskdb.', 'completed', 'high', 'DevOps', '2026-09-30'),
      ('Desarrollar API REST con Express 5', 'Implementar rutas CRUD usando las últimas novedades de Express 5 y control de errores asíncrono.', 'in_progress', 'high', 'Backend', '2026-10-05'),
      ('Diseñar interfaz de usuario con React 19 y Vite', 'Construir Dashboard interactivo con tema glassmorphism y métricas en tiempo real.', 'pending', 'medium', 'Frontend', '2026-10-10'),
      ('Auditoría de Seguridad y Pruebas E2E', 'Validar la protección de endpoints, sanitización de consultas SQL y responsividad UI.', 'pending', 'low', 'QA', '2026-10-15');
    `;
    await pool.query(seedQuery);

    console.log(' Seed completado con éxito.');
  } catch (error) {
    console.error('❌ Error ejecutando el seed:', error.message);
  } finally {
    await pool.end();
  }
}

runSeed();
