// Middleware de errores globales
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
}

// Middleware para rutas no encontradas
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.url}`
  });
}

module.exports = { errorHandler, notFound };