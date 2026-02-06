const fetch = require('node-fetch');
const { SUPERHERO_BASE_URL } = require('../config/env');

/* =========================
   🔧 FUNCIÓN AUXILIAR MEJORADA
========================== */
// Solo añadimos esta función para que las imágenes no se bloqueen
function cleanImageUrl(url) {
  if (!url) return '';
  return `https://images.weserv.nl/?url=${url.replace('https://', '').replace('http://', '')}`;
}

async function fetchSuperhero(endpoint) {
  try {
    const res = await fetch(`${SUPERHERO_BASE_URL}/${endpoint}`);
    if (!res.ok) throw new Error(`Superhero API error: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('❌ Error fetch Superhero:', error.message);
    throw error;
  }
}

/* =========================
   📋 TODOS LOS PERSONAJES (A-Z)
========================== */
async function getAllCharacters(req, res) {
  try {
    console.log('📋 Obteniendo todos los personajes A-Z...');
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const allCharacters = [];
    const seenIds = new Set();

    const promises = letters.map(letter => fetchSuperhero(`search/${letter}`));
    const results = await Promise.all(promises);

    results.forEach(data => {
      if (data.response === 'success' && data.results) {
        data.results.forEach(char => {
          if (!seenIds.has(char.id)) {
            seenIds.add(char.id);
            allCharacters.push({
              id: char.id,
              name: char.name,
              // CAMBIO AQUÍ: Usamos cleanImageUrl
              image: cleanImageUrl(char.image.url),
              publisher: char.biography.publisher,
              alignment: char.biography.alignment
            });
          }
        });
      }
    });

    allCharacters.sort((a, b) => a.name.localeCompare(b.name));
    console.log(`✅ Total personajes encontrados: ${allCharacters.length}`);
    res.json({ success: true, total: allCharacters.length, data: allCharacters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   🔍 BUSCAR POR NOMBRE
========================== */
async function searchByName(req, res) {
  try {
    const { name } = req.params;
    console.log('🔍 Buscando:', name);

    const data = await fetchSuperhero(`search/${name.trim()}`);

    if (data.response === 'error') {
      return res.status(404).json({ success: false, error: 'Personaje no encontrado' });
    }

    const characters = data.results.map(char => ({
      id: char.id,
      name: char.name,
      // CAMBIO AQUÍ: Usamos cleanImageUrl
      image: cleanImageUrl(char.image.url),
      publisher: char.biography.publisher,
      alignment: char.biography.alignment
    }));

    res.json({ success: true, data: characters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   👤 PERSONAJE POR ID (completo)
========================== */
async function getCharacterById(req, res) {
  try {
    const { id } = req.params;
    console.log('👤 Cargando personaje:', id);

    const [fullData, powerstats, biography, appearance, work, connections] = await Promise.all([
      fetchSuperhero(id),
      fetchSuperhero(`${id}/powerstats`),
      fetchSuperhero(`${id}/biography`),
      fetchSuperhero(`${id}/appearance`),
      fetchSuperhero(`${id}/work`),
      fetchSuperhero(`${id}/connections`)
    ]);

    const character = {
      id: fullData.id,
      name: fullData.name,
      // CAMBIO AQUÍ: Usamos cleanImageUrl
      image: cleanImageUrl(fullData.image.url),

      powerstats: powerstats.powerstats,
      biography: {
        realName: biography.biography['real name'],
        aliases: biography.biography.aliases,
        placeOfBirth: biography.biography['place of birth'],
        firstAppearance: biography.biography['first appearance'],
        publisher: biography.biography.publisher,
        alignment: biography.biography.alignment
      },
      appearance: appearance.appearance,
      work: work.work,
      connections: connections.connections
    };

    res.json({ success: true, data: character });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* ============ LAS DEMÁS FUNCIONES SE QUEDAN IGUAL ============ */
async function getPowerstats(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/powerstats`);
    res.json({ success: true, data: data.powerstats });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function getBiography(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/biography`);
    res.json({ success: true, data: data.biography });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function getAppearance(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/appearance`);
    res.json({ success: true, data: data.appearance });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function getWork(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/work`);
    res.json({ success: true, data: data.work });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function getConnections(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/connections`);
    res.json({ success: true, data: data.connections });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function getImage(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/image`);
    // CAMBIO AQUÍ: También limpiamos la imagen suelta
    res.json({ success: true, data: cleanImageUrl(data.url) });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

module.exports = {
  getAllCharacters,
  searchByName,
  getCharacterById,
  getPowerstats,
  getBiography,
  getAppearance,
  getWork,
  getConnections,
  getImage
};