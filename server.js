const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const superheroRoutes = require('./routes/superhero.routes.js');
const comicvineRoutes = require('./routes/comicvineRoutes.js');

const app = express();

// ✅ CORS MÁS PERMISIVO
app.use(cors({
  origin: '*', // Permitir TODAS las origins temporalmente
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('🚀 Puerto configurado:', PORT);
console.log('🔧 Tipo de PORT:', typeof PORT);

/* =========================
   🛣️ RUTAS
========================== */
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '✅ Backend Fandom Explorer funcionando' });
});

app.use('/api/superhero', superheroRoutes);
app.use('/api/comicvine', comicvineRoutes);

/* =========================
   ❌ MANEJO DE ERRORES
========================== */
app.use(notFound);
app.use(errorHandler);

/* =========================
   🚀 INICIAR SERVIDOR
========================== */
const portNumber = Number(PORT) || 3000;
app.listen(portNumber, '0.0.0.0', () => {
  console.log(`🚀 Backend iniciado en puerto: ${portNumber}`);
  console.log(`📡 Rutas disponibles:`);
  console.log(`   - /api/superhero`);
  console.log(`   - /api/comicvine`);
});