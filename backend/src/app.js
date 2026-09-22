import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    engine: 'Express 5.0 & Node.js 20+',
    postgres: 'PostgreSQL 17 Ready'
  });
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
