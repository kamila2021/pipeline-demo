import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

/**
 * GET /api/tasks/stats
 * Obtener métricas y contadores de tareas por estado
 */
router.get('/stats', async (req, res) => {
  const result = await query(`
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed
    FROM tasks;
  `);

  const stats = result.rows[0] || { total: 0, pending: 0, in_progress: 0, completed: 0 };

  res.json({
    success: true,
    data: {
      total: Number(stats.total || 0),
      pending: Number(stats.pending || 0),
      in_progress: Number(stats.in_progress || 0),
      completed: Number(stats.completed || 0),
    },
  });
});

/**
 * GET /api/tasks
 * Listar tareas con soporte para filtro por estado y búsqueda por título/descripción
 */
router.get('/', async (req, res) => {
  const { status, search } = req.query;

  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length} OR category ILIKE $${params.length})`;
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);

  res.json({
    success: true,
    count: result.rowCount,
    data: result.rows,
  });
});

/**
 * GET /api/tasks/:id
 * Obtener detalle de una tarea por su ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM tasks WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    res.status(404);
    throw new Error(`Tarea con ID ${id} no encontrada.`);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * POST /api/tasks
 * Crear una nueva tarea
 */
router.post('/', async (req, res) => {
  const { title, description, status = 'pending', priority = 'medium', category = 'General', due_date } = req.body;

  if (!title || title.trim() === '') {
    res.status(400);
    throw new Error('El título de la tarea es obligatorio.');
  }

  const insertSql = `
    INSERT INTO tasks (title, description, status, priority, category, due_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const result = await query(insertSql, [
    title.trim(),
    description || '',
    status,
    priority,
    category || 'General',
    due_date || null,
  ]);

  res.status(201).json({
    success: true,
    message: 'Tarea creada exitosamente.',
    data: result.rows[0],
  });
});

/**
 * PUT /api/tasks/:id
 * Actualizar una tarea existente
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, category, due_date } = req.body;

  const checkResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (checkResult.rowCount === 0) {
    res.status(404);
    throw new Error(`Tarea con ID ${id} no encontrada.`);
  }

  const existing = checkResult.rows[0];

  const updateSql = `
    UPDATE tasks
    SET 
      title = $1,
      description = $2,
      status = $3,
      priority = $4,
      category = $5,
      due_date = $6
    WHERE id = $7
    RETURNING *;
  `;

  const result = await query(updateSql, [
    title !== undefined ? title.trim() : existing.title,
    description !== undefined ? description : existing.description,
    status !== undefined ? status : existing.status,
    priority !== undefined ? priority : existing.priority,
    category !== undefined ? category : existing.category,
    due_date !== undefined ? due_date : existing.due_date,
    id,
  ]);

  res.json({
    success: true,
    message: 'Tarea actualizada exitosamente.',
    data: result.rows[0],
  });
});

/**
 * DELETE /api/tasks/:id
 * Eliminar una tarea por ID
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await query('DELETE FROM tasks WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    res.status(404);
    throw new Error(`Tarea con ID ${id} no encontrada.`);
  }

  res.json({
    success: true,
    message: `Tarea con ID ${id} eliminada correctamente.`,
  });
});

export default router;
