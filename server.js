const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Rutas

const superheroRoutes = require('./routes/superhero.routes.js');
const app = express();

/* =========================
   ⚙️ CONFIGURACIÓN
========================== */
app.use(cors());
app.use(express.json());

/* =========================
   🛣️ RUTAS
========================== */
// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '✅ Backend Fandom Explorer funcionando' });
});

// Superhero
app.use('/api/superhero', superheroRoutes);

/* =========================
   ❌ MANEJO DE ERRORES
========================== */
app.use(notFound);
app.use(errorHandler);

/* =========================
   🚀 INICIAR SERVIDOR
========================== */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend iniciado en puerto: ${PORT}`);
});