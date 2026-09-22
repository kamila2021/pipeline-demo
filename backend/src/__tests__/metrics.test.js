import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { pool } from '../db/index.js';

describe('Métricas Prometheus (/metrics)', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('GET /metrics debe retornar 200 con formato Prometheus válido', async () => {
    const res = await request(app).get('/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toMatch(/^# HELP/m);
    expect(res.text).toContain('backend_process_cpu_user_seconds_total');
  });
});
