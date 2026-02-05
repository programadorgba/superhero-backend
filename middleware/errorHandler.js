function notFound(req, res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.url}`);
  error.status = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  console.error('❌ Error:', err.message);
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}

module.exports = { notFound, errorHandler };