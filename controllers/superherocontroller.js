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
              image: `https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/${char.id}.jpg`,
              publisher: char.biography?.publisher || 'Unknown',
              alignment: char.biography?.alignment || 'neutral'
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

    // Mapear con validación - USANDO CDN PARA IMÁGENES
    const characters = data.results.map(char => ({
      id: char.id,
      name: char.name,
      image: `https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/${char.id}.jpg`,
      publisher: char.biography?.publisher || 'Unknown',
      alignment: char.biography?.alignment || 'neutral'
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

    // UNA sola llamada - la API devuelve TODO
    const fullData = await fetchSuperhero(id);

    // Validar respuesta principal
    if (!fullData || fullData.response === 'error') {
      console.warn('⚠️ Personaje no encontrado en Superhero API:', fullData?.error);
      return res.status(404).json({
        success: false,
        error: fullData?.error || 'Personaje no encontrado'
      });
    }

    // Combinar todo en un solo objeto limpio - USANDO CDN PARA IMAGEN
    const character = {
      id: fullData.id,
      name: fullData.name,
      image: `https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/${fullData.id}.jpg`,

      powerstats: {
        intelligence: fullData.powerstats?.intelligence || 'null',
        strength: fullData.powerstats?.strength || 'null',
        speed: fullData.powerstats?.speed || 'null',
        durability: fullData.powerstats?.durability || 'null',
        power: fullData.powerstats?.power || 'null',
        combat: fullData.powerstats?.combat || 'null'
      },

      biography: {
        realName: fullData.biography?.['full-name'] || '',
        aliases: fullData.biography?.aliases || [],
        placeOfBirth: fullData.biography?.['place-of-birth'] || '-',
        firstAppearance: fullData.biography?.['first-appearance'] || '-',
        publisher: fullData.biography?.publisher || 'Unknown',
        alignment: fullData.biography?.alignment || 'neutral'
      },

      appearance: {
        gender: fullData.appearance?.gender || '-',
        race: fullData.appearance?.race || '-',
        height: fullData.appearance?.height || ['-'],
        weight: fullData.appearance?.weight || ['-'],
        eyeColor: fullData.appearance?.['eye-color'] || '-',
        hairColor: fullData.appearance?.['hair-color'] || '-'
      },

      work: {
        occupation: fullData.work?.occupation || '-',
        base: fullData.work?.base || '-'
      },

      connections: {
        connectedTo: fullData.connections?.['group-affiliation'] || '-',
        relatives: fullData.connections?.relatives || '-'
      }
    };

    res.json({ success: true, data: character });
  } catch (error) {
    console.error('❌ Error en getCharacterById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/* =========================
   📊 SOLO POWERSTATS
========================== */
async function getPowerstats(req, res) {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(id);

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
    const data = await fetchSuperhero(id);

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
    const data = await fetchSuperhero(id);

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
    const data = await fetchSuperhero(id);

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
    const data = await fetchSuperhero(id);

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
    const data = await fetchSuperhero(id);

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