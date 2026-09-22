/**
 * Middleware centralizado de errores para Express 5.
 * En Express 5, las promesas rechazadas en rutas asíncronas pasan automáticamente a este middleware.
 */
export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('💥 Error detectado en Express 5:', err);
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}
