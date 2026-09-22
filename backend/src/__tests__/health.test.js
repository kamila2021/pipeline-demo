import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { pool } from '../db/index.js';

describe('Endpoints de Salud (Health Checks)', () => {
  afterAll(async () => {
    await pool.end();
  });
  it('GET /health debe retornar 200 OK con estructura de diagnóstico válida', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'backend-taskdb');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('mode');
    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('memoryRssMB');
  });

  it('GET /api/health debe retornar 200 OK igual que la ruta principal', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
