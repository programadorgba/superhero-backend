const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const superheroRoutes = require('./routes/superhero.routes.js');

const app = express();
app.use(cors());
app.use(express.json());

// DEBUG: Ver puerto real
console.log('🚀 Puerto configurado:', PORT);
console.log('🔧 Tipo de PORT:', typeof PORT);

/* =========================
   ⚙️ CONFIGURACIÓN
========================== 
app.use(cors());
app.use(express.json());*/

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
const portNumber = Number(PORT) || 3000;
app.listen(portNumber, '0.0.0.0', () => {
  console.log(`🚀 Backend iniciado en puerto: ${portNumber}`);
});