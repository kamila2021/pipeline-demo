import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import tasksRouter from './routes/tasks.js';
import { errorHandler } from './middleware/errorHandler.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { logger } from './logger.js';
import { register } from './metrics.js';

import { getDbStatus } from './db/index.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/api/health' || req.url === '/metrics',
  },
}));
app.use(metricsMiddleware);

// Healthcheck Handler
const handleHealthCheck = (req, res) => {
  const dbStatus = getDbStatus();
  const memory = process.memoryUsage();

  res.status(200).json({
    status: 'ok',
    service: 'backend-taskdb',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    engine: `Node.js ${process.version} (Express 5)`,
    database: {
      connected: dbStatus.connected,
      mode: dbStatus.mode
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      memoryHeapUsedMB: (memory.heapUsed / 1024 / 1024).toFixed(2),
      memoryRssMB: (memory.rss / 1024 / 1024).toFixed(2)
    }
  });
};

// Top-level local health check (Ideal para Nginx / Systemd Watchdog)
app.get('/health', handleHealthCheck);

// Healthcheck Route anterior mantenida por compatibilidad
app.get('/api/health', handleHealthCheck);

// Métricas Prometheus (scrape target)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// API Routes
app.use('/api/tasks', tasksRouter);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Ruta no encontrada - ${req.originalUrl}`));
});

// Express 5 Error Handler Middleware
app.use(errorHandler);

export default app;
