import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { pool } from '../db/index.js';

describe('API REST de Tareas (/api/tasks)', () => {
  afterAll(async () => {
    await pool.end();
  });

  // ==========================================
  // 🟢 CASOS CORRECTOS / FUNCIONES PRINCIPALES
  // ==========================================

  describe('Flujo Exitoso (Happy Path)', () => {
    let createdTaskId;

    it('GET /api/tasks debe obtener la lista inicial de tareas', async () => {
      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/tasks/stats debe retornar el contador de métricas', async () => {
      const res = await request(app).get('/api/tasks/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('pending');
      expect(res.body.data).toHaveProperty('in_progress');
      expect(res.body.data).toHaveProperty('completed');
    });

    it('POST /api/tasks debe crear una nueva tarea válidamente', async () => {
      const payload = {
        title: 'Tarea de Prueba Automatizada',
        description: 'Verificando que la API cree tareas correctamente',
        status: 'pending',
        priority: 'high',
        category: 'Testing',
        due_date: '2026-12-31'
      };

      const res = await request(app)
        .post('/api/tasks')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.category).toBe('Testing');

      createdTaskId = res.body.data.id;
    });

    it('GET /api/tasks/:id debe obtener el detalle de la tarea recién creada', async () => {
      expect(createdTaskId).toBeDefined();

      const res = await request(app).get(`/api/tasks/${createdTaskId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdTaskId);
      expect(res.body.data.title).toBe('Tarea de Prueba Automatizada');
    });

    it('PUT /api/tasks/:id debe actualizar el estado y prioridad de la tarea', async () => {
      expect(createdTaskId).toBeDefined();

      const updatePayload = {
        status: 'completed',
        priority: 'low',
        title: 'Tarea de Prueba Actualizada'
      };

      const res = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.title).toBe('Tarea de Prueba Actualizada');
    });

    it('DELETE /api/tasks/:id debe eliminar la tarea existente', async () => {
      expect(createdTaskId).toBeDefined();

      const res = await request(app).delete(`/api/tasks/${createdTaskId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('eliminada correctamente');
    });
  });

  // ==========================================
  // 🔴 CASOS INCORRECTOS / ERRORES Y VALIDACIONES
  // ==========================================

  describe('Evaluación de Casos Erróneos y Bordes', () => {

    it('POST /api/tasks sin título debe retornar 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          description: 'Intento de crear sin título',
          status: 'pending'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('título de la tarea es obligatorio');
    });

    it('POST /api/tasks con título solo con espacios en blanco debe retornar 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: '   ',
          description: 'Espacios vacíos'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('título de la tarea es obligatorio');
    });

    it('GET /api/tasks/:id con un ID inexistente debe retornar 404 Not Found', async () => {
      const res = await request(app).get('/api/tasks/999999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no encontrada');
    });

    it('PUT /api/tasks/:id con un ID inexistente debe retornar 404 Not Found', async () => {
      const res = await request(app)
        .put('/api/tasks/999999')
        .send({ status: 'completed' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no encontrada');
    });

    it('DELETE /api/tasks/:id con un ID inexistente debe retornar 404 Not Found', async () => {
      const res = await request(app).delete('/api/tasks/999999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no encontrada');
    });

    it('Solicitud a una ruta inexistente debe retornar 404 Not Found', async () => {
      const res = await request(app).get('/api/ruta-fantasma-inexistente');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Ruta no encontrada');
    });
  });
});
