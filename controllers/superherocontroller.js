const fetch = require('node-fetch');
const { SUPERHERO_BASE_URL } = require('../config/env');

/* =========================
   🔧 FUNCIÓN AUXILIAR
   Hace la petición a Superhero API
========================== */
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

    // Búsquedas en paralelo por letra
    const promises = letters.map(letter => fetchSuperhero(`search/${letter}`));
    const results = await Promise.all(promises);

    // Combinar resultados y eliminar duplicados
    results.forEach(data => {
      if (data.response === 'success' && data.results) {
        data.results.forEach(char => {
          if (!seenIds.has(char.id)) {
            seenIds.add(char.id);
            allCharacters.push({
              id: char.id,
              name: char.name,
              image: char.image.url,
              publisher: char.biography.publisher,
              alignment: char.biography.alignment
            });
          }
        });
      }
    });

    // Ordenar alfabéticamente
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

    const data = await fetchSuperhero(`search/${name}`);

    if (data.response === 'error') {
      return res.status(404).json({ success: false, error: 'Personaje no encontrado' });
    }

    // Mapear con validación (?.  evita errores si algo es null/undefined)
    const characters = data.results.map(char => ({
      id: char.id,
      name: char.name,
      image: char.image?.url || '',  // ← CAMBIA ESTO
      publisher: char.biography?.publisher || 'Unknown',  // ← Y ESTO
      alignment: char.biography?.alignment || 'neutral'   // ← Y ESTO
    }));

    res.json({ success: true, data: characters });
  } catch (error) {
    console.error('❌ Error en searchByName:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   👤 PERSONAJE POR ID (completo)
   Trae TODA la información
========================== */
async function getCharacterById(req, res) {
  try {
    const { id } = req.params;
    console.log('👤 Cargando personaje:', id);

    // Llamadas en paralelo para ser rápido
    const [
      fullData,
      powerstats,
      biography,
      appearance,
      work,
      connections
    ] = await Promise.all([
      fetchSuperhero(id),
      fetchSuperhero(`${id}/powerstats`),
      fetchSuperhero(`${id}/biography`),
      fetchSuperhero(`${id}/appearance`),
      fetchSuperhero(`${id}/work`),
      fetchSuperhero(`${id}/connections`)
    ]);

    // Validar respuesta principal
    if (!fullData || fullData.response === 'error') {
      console.warn('⚠️ Personaje no encontrado en Superhero API:', fullData?.error);
      return res.status(404).json({
        success: false,
        error: fullData?.error || 'Personaje no encontrado'
      });
    }

    // Combinar todo en un solo objeto limpio
    const character = {
      id: fullData.id,
      name: fullData.name,
      image: fullData.image?.url || '',

      powerstats: {
        intelligence: powerstats.powerstats?.intelligence,
        strength: powerstats.powerstats?.strength,
        speed: powerstats.powerstats?.speed,
        durability: powerstats.powerstats?.durability,
        power: powerstats.powerstats?.power,
        combat: powerstats.powerstats?.combat
      },

      biography: {
        realName: biography.biography?.['real name'],
        aliases: biography.biography?.aliases,
        placeOfBirth: biography.biography?.['place of birth'],
        firstAppearance: biography.biography?.['first appearance'],
        publisher: biography.biography?.publisher,
        alignment: biography.biography?.alignment
      },

      appearance: {
        gender: appearance.appearance?.gender,
        race: appearance.appearance?.race,
        height: appearance.appearance?.height,
        weight: appearance.appearance?.weight,
        eyeColor: appearance.appearance?.['eye color'],
        hairColor: appearance.appearance?.['hair color']
      },

      work: {
        occupation: work.work?.occupation,
        base: work.work?.base
      },

      connections: {
        connectedTo: connections.connections?.['connected to']
      }
    };

    res.json({ success: true, data: character });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   📊 SOLO POWERSTATS
========================== */
async function getPowerstats(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/powerstats`);

    res.json({ success: true, data: data.powerstats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   📖 SOLO BIOGRAFÍA
========================== */
async function getBiography(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/biography`);

    res.json({ success: true, data: data.biography });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   👁️ SOLO APARIENCIA
========================== */
async function getAppearance(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/appearance`);

    res.json({ success: true, data: data.appearance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   💼 SOLO TRABAJO
========================== */
async function getWork(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/work`);

    res.json({ success: true, data: data.work });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   🔗 SOLO CONEXIONES
========================== */
async function getConnections(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/connections`);

    res.json({ success: true, data: data.connections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   🖼️ SOLO IMAGEN
========================== */
async function getImage(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${character-id}/image`);

    res.json({ success: true, data: data.image });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
