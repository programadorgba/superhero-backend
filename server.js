const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Rutas
//const superheroRoutes = require('./routes/superhero.routes');
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
app.listen(PORT, () => {
  console.log(`🚀 Backend iniciado en: http://localhost:${PORT}`);
  console.log(`📋 Rutas disponibles:`);
  console.log(`   GET /api/health`);
  console.log(`   GET /api/superhero/search/:name`);
  console.log(`   GET /api/superhero/character/:id`);
  console.log(`   GET /api/superhero/character/:id/powerstats`);
  console.log(`   GET /api/superhero/character/:id/biography`);
  console.log(`   GET /api/superhero/character/:id/appearance`);
  console.log(`   GET /api/superhero/character/:id/work`);
  console.log(`   GET /api/superhero/character/:id/connections`);
  console.log(`   GET /api/superhero/character/:id/image`);
});