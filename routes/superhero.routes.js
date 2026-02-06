const express = require('express');
const router = express.Router();
const superhero = require('../controllers/superherocontroller.js');

/* =========================
   📋 RUTAS SUPERHERO
========================== */

// 📋 Todos los personajes (A-Z)
// GET /api/superhero/characters
router.get('/characters', superhero.getAllCharacters);

// 🔍 Buscar por nombre
// GET /api/superhero/search/:name
router.get('/search/:name', superhero.searchByName);

// 👤 Personaje completo (toda la información junta)
// GET /api/superhero/character/:id
router.get('/character/:id', superhero.getCharacterById);

// 📊 Solo powerstats
// GET /api/superhero/character/:id/powerstats
router.get('/character/:id/powerstats', superhero.getPowerstats);

// 📖 Solo biografía
// GET /api/superhero/character/:id/biography
router.get('/character/:id/biography', superhero.getBiography);

// 👁️ Solo apariencia
// GET /api/superhero/character/:id/appearance
router.get('/character/:id/appearance', superhero.getAppearance);

// 💼 Solo trabajo
// GET /api/superhero/character/:id/work
router.get('/character/:id/work', superhero.getWork);

// 🔗 Solo conexiones
// GET /api/superhero/character/:id/connections
router.get('/character/:id/connections', superhero.getConnections);

// 🖼️ Solo imagen
// GET /api/superhero/character/:id/image
router.get('/character/:id/image', superhero.getImage);

module.exports = router;