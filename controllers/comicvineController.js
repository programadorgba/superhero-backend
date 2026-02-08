const fetch = require('node-fetch');
const { COMICVINE_API_KEY } = require('../config/env');

const COMICVINE_BASE_URL = 'https://comicvine.gamespot.com/api';

/**
 * Función auxiliar para hacer peticiones a Comic Vine API
 */
async function fetchComicVine(endpoint, params = {}) {
  try {
    const queryParams = new URLSearchParams({
      api_key: COMICVINE_API_KEY,
      format: 'json',
      ...params
    });

    const url = `${COMICVINE_BASE_URL}${endpoint}?${queryParams}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Comic Vine API error: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.status_code !== 1) {
      throw new Error(data.error || 'Error en Comic Vine API');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetch Comic Vine:', error.message);
    throw error;
  }
}

/**
 * Obtener películas y cómics de un personaje por nombre
 * GET /api/comicvine/character/:name/media
 */
async function getCharacterMedia(req, res) {
  try {
    const { name } = req.params;
    console.log('🎬 Buscando media para:', name);

    // Buscar el personaje
    const characterData = await fetchComicVine('/characters/', {
      filter: `name:${name}`,
      limit: 1
    });

    if (!characterData.results || characterData.results.length === 0) {
      return res.json({
        success: true,
        data: { movies: [], comics: [] }
      });
    }

    const character = characterData.results[0];
    const characterId = character.id;

    // Buscar películas y cómics en paralelo
    const [moviesData, comicsData] = await Promise.all([
      fetchComicVine('/movies/', {
        filter: `characters:${characterId}`,
        limit: 20
      }).catch(() => ({ results: [] })),
      
      fetchComicVine('/issues/', {
        filter: `characters:${characterId}`,
        limit: 20,
        sort: 'cover_date:desc'
      }).catch(() => ({ results: [] }))
    ]);

    const result = {
      movies: moviesData.results || [],
      comics: comicsData.results || []
    };

    console.log(`✅ Encontradas ${result.movies.length} películas y ${result.comics.length} cómics`);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error en getCharacterMedia:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: { movies: [], comics: [] }
    });
  }
}

module.exports = {
  getCharacterMedia
};