const express = require('express');
const router = express.Router();
const comicvine = require('../controllers/comicvineController.js');

/* =========================
   📋 RUTAS COMIC VINE
========================== */

// 🎬 Obtener películas y cómics de un personaje
// GET /api/comicvine/character/:name/media
router.get('/character/:name/media', comicvine.getCharacterMedia);

module.exports = router;