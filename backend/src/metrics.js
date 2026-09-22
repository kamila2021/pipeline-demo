import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'backend_' });

export const httpRequestDuration = new client.Histogram({
  name: 'backend_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: 'backend_http_requests_total',
  help: 'Total HTTP requests by status code',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});
