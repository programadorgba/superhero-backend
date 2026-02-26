require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const fetch   = require('node-fetch')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const SUPERHERO_API_KEY = process.env.SUPERHERO_API_KEY || ''
const COMICVINE_API_KEY = process.env.COMICVINE_API_KEY || ''
const TMDB_API_KEY      = process.env.TMDB_API_KEY      || ''

const SUPERHERO_BASE = `https://superheroapi.com/api/${SUPERHERO_API_KEY}`
const COMICVINE_BASE = 'https://comicvine.gamespot.com/api'
const TMDB_BASE      = 'https://api.themoviedb.org/3'
const TMDB_IMG       = 'https://image.tmdb.org/t/p/w500'

// ─── Store en memoria ─────────────────────────────────────────────────────────
const store = {
  heroes:     [],
  publishers: [],
  loaded:     false,
  loading:    false,
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchHero(id) {
  const res = await fetch(`${SUPERHERO_BASE}/${id}`, { timeout: 10000 })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.response === 'error') throw new Error('not found')
  return data
}

async function fetchComicVine(endpoint, params = {}) {
  const query = new URLSearchParams({ api_key: COMICVINE_API_KEY, format: 'json', ...params })
  const res   = await fetch(`${COMICVINE_BASE}/${endpoint}?${query}`, { timeout: 12000 })
  if (!res.ok) throw new Error(`ComicVine HTTP ${res.status}`)
  return await res.json()
}

async function fetchTMDB(endpoint, params = {}) {
  const query = new URLSearchParams({ api_key: TMDB_API_KEY, language: 'es-ES', ...params })
  const res   = await fetch(`${TMDB_BASE}/${endpoint}?${query}`, { timeout: 10000 })
  if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`)
  return await res.json()
}

// ─── Busca películas de un personaje en TMDB ──────────────────────────────────
async function getMoviesFromTMDB(heroName) {
  if (!TMDB_API_KEY) return []
  try {
    // 1. Buscar el personaje en TMDB
    const search = await fetchTMDB('search/person', { query: heroName })
    const person = search.results?.[0]
    if (!person) return []

    // 2. Obtener sus créditos de películas
    const credits = await fetchTMDB(`person/${person.id}/movie_credits`)
    const movies  = credits.cast || []

    return movies
      .filter(m => m.poster_path)         // solo las que tienen póster
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 15)
      .map(m => ({
        id:          m.id,
        title:       m.title,
        character:   m.character || '',
        poster:      `${TMDB_IMG}${m.poster_path}`,
        year:        m.release_date?.split('-')[0] || null,
        overview:    m.overview || '',
        voteAverage: m.vote_average || null,
      }))
  } catch (err) {
    console.warn(`[TMDB] ${heroName}:`, err.message)
    return []
  }
}

// ─── Busca comics en ComicVine ────────────────────────────────────────────────
async function getComicsFromComicVine(heroName) {
  if (!COMICVINE_API_KEY) return []
  try {
    const cvSearch = await fetchComicVine('search', {
      query:      heroName,
      resources:  'character',
      limit:      1,
      field_list: 'id,name,issue_credits',
    })
    const cvChar = cvSearch.results?.[0]
    if (!cvChar) return []

    return (cvChar.issue_credits || []).slice(0, 20).map(c => ({
      id:    c.id,
      name:  c.name,
      image: c.image?.medium_url || null,
    }))
  } catch (err) {
    console.warn(`[ComicVine] ${heroName}:`, err.message)
    return []
  }
}

// ─── Normaliza conservando TODO lo que devuelve SuperheroAPI ─────────────────
function normalizeHero(raw) {
  return {
    id:        raw.id,
    name:      raw.name,
    image:     raw.image?.url || null,
    publisher: raw.biography?.publisher || 'Unknown',
    alignment: raw.biography?.alignment || 'neutral',

    powerstats: {
      intelligence: raw.powerstats?.intelligence || '0',
      strength:     raw.powerstats?.strength     || '0',
      speed:        raw.powerstats?.speed        || '0',
      durability:   raw.powerstats?.durability   || '0',
      power:        raw.powerstats?.power        || '0',
      combat:       raw.powerstats?.combat       || '0',
    },

    biography: {
      fullName:        raw.biography?.['full-name']        || '',
      alterEgos:       raw.biography?.['alter-egos']       || '',
      aliases:         raw.biography?.aliases              || [],
      placeOfBirth:    raw.biography?.['place-of-birth']   || '',
      firstAppearance: raw.biography?.['first-appearance'] || '',
      publisher:       raw.biography?.publisher            || '',
      alignment:       raw.biography?.alignment            || '',
    },

    appearance: {
      gender:    raw.appearance?.gender         || '',
      race:      raw.appearance?.race           || '',
      height:    raw.appearance?.height         || [],
      weight:    raw.appearance?.weight         || [],
      eyeColor:  raw.appearance?.['eye-color']  || '',
      hairColor: raw.appearance?.['hair-color'] || '',
    },

    work: {
      occupation: raw.work?.occupation || '',
      base:       raw.work?.base       || '',
    },

    connections: {
      groupAffiliation: raw.connections?.['group-affiliation'] || '',
      relatives:        raw.connections?.relatives             || '',
    },
  }
}

// ─── Carga masiva ─────────────────────────────────────────────────────────────
async function loadAllHeroes() {
  if (store.loaded || store.loading) return
  store.loading = true
  console.log('[Superhero] Cargando personajes...')

  const TOTAL = 731
  const BATCH = 10

  for (let i = 1; i <= TOTAL; i += BATCH) {
    const ids   = Array.from({ length: Math.min(BATCH, TOTAL - i + 1) }, (_, k) => i + k)
    const batch = await Promise.allSettled(ids.map(fetchHero))
    for (const result of batch) {
      if (result.status === 'fulfilled') {
        try { store.heroes.push(normalizeHero(result.value)) } catch { /* skip */ }
      }
    }
    if (i % 100 === 1) console.log(`[Superhero] ${store.heroes.length}/${TOTAL}...`)
    await sleep(300)
  }

  const pubSet = new Set(store.heroes.map(h => h.publisher).filter(Boolean))
  store.publishers = [...pubSet].sort()
  store.loaded  = true
  store.loading = false
  console.log(`[Superhero] ✅ ${store.heroes.length} personajes listos`)
}

async function ensureLoaded(req, res, next) {
  if (store.loaded) return next()
  if (!store.loading) loadAllHeroes()
  let attempts = 0
  while (!store.loaded && attempts < 600) { await sleep(500); attempts++ }
  if (!store.loaded) return res.status(503).json({ error: 'Datos aún cargando, intenta en unos segundos' })
  next()
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

// Lista completa
app.get('/api/universe', ensureLoaded, (req, res) => {
  res.json({ heroes: store.heroes, publishers: store.publishers })
})

// Detalle: héroe + comics (ComicVine) + películas (TMDB) en paralelo
app.get('/api/superhero/:id', ensureLoaded, async (req, res) => {
  const hero = store.heroes.find(h => h.id === req.params.id)
  if (!hero) return res.status(404).json({ error: 'Personaje no encontrado' })

  const [comics, movies] = await Promise.all([
    getComicsFromComicVine(hero.name),
    getMoviesFromTMDB(hero.name),
  ])

  res.json({ ...hero, comics, movies })
})

// Status
app.get('/api/status', (req, res) => {
  res.json({
    loaded: store.loaded, loading: store.loading,
    heroes: store.heroes.length, publishers: store.publishers.length,
    apis: {
      superhero: !!SUPERHERO_API_KEY,
      comicvine: !!COMICVINE_API_KEY,
      tmdb:      !!TMDB_API_KEY,
    }
  })
})

// ─── Arranque ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Superhero] Puerto ${PORT}`)
  console.log(`  Superhero API : ${SUPERHERO_API_KEY ? '✅' : '❌'}`)
  console.log(`  ComicVine API : ${COMICVINE_API_KEY ? '✅' : '❌'}`)
  console.log(`  TMDB API      : ${TMDB_API_KEY      ? '✅' : '❌'}`)
  loadAllHeroes()
})