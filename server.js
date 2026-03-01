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

const SUPERHERO_BASE = `https://superheroapi.com/api/${SUPERHERO_API_KEY}`
const COMICVINE_BASE = 'https://comicvine.gamespot.com/api'

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

// ─── Películas desde Wikipedia ────────────────────────────────────────────────
async function getMoviesFromWikipedia(heroName) {
  try {
    // 1. Buscar la página del personaje en Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(heroName + ' superhero')}&format=json&origin=*&srlimit=1`
    const searchRes  = await fetch(searchUrl, { timeout: 10000 })
    const searchData = await searchRes.json()
    const page       = searchData.query?.search?.[0]
    if (!page) return []

    // 2. Obtener las secciones de esa página buscando "film" o "filmography"
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvsection=0&titles=${encodeURIComponent(page.title)}&format=json&origin=*`
    
    // 3. Buscar películas conocidas con el personaje usando opensearch
    const filmSearch = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(heroName + ' film')}&limit=8&format=json&origin=*`
    const filmRes    = await fetch(filmSearch, { timeout: 10000 })
    const filmData   = await filmRes.json()

    // filmData = [query, [titles], [descriptions], [urls]]
    const titles = filmData[1] || []
    const descs  = filmData[2] || []
    const urls   = filmData[3] || []

    // 4. Para cada resultado, buscar thumbnail en Wikipedia
    const movies = await Promise.all(
      titles.slice(0, 10).map(async (title, i) => {
        try {
          const thumbUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=300&format=json&origin=*`
          const thumbRes  = await fetch(thumbUrl, { timeout: 8000 })
          const thumbData = await thumbRes.json()
          const pages     = Object.values(thumbData.query?.pages || {})
          const thumb     = pages[0]?.thumbnail?.source || null

          // Extraer año del título o descripción
          const yearMatch = (title + descs[i]).match(/\b(19|20)\d{2}\b/)
          const year      = yearMatch ? yearMatch[0] : null

          return { title, poster: thumb, year, url: urls[i] }
        } catch {
          return { title, poster: null, year: null, url: urls[i] }
        }
      })
    )

    return movies.filter(m => m.title.toLowerCase().includes('film') || 
                              m.title.toLowerCase().includes('movie') ||
                              m.title.toLowerCase().includes(heroName.toLowerCase().split(' ')[0]))
  } catch (err) {
    console.warn(`[Wikipedia] ${heroName}:`, err.message)
    return []
  }
}

// ─── Cómics desde ComicVine ───────────────────────────────────────────────────
async function getComicsFromComicVine(heroName) {
  if (!COMICVINE_API_KEY) return []
  try {
    const query = new URLSearchParams({
      api_key:    COMICVINE_API_KEY,
      format:     'json',
      query:      heroName,
      resources:  'character',
      limit:      1,
      field_list: 'id,name,issue_credits',
    })
    const res  = await fetch(`${COMICVINE_BASE}/search?${query}`, { timeout: 12000 })
    if (!res.ok) throw new Error(`ComicVine HTTP ${res.status}`)
    const data   = await res.json()
    const cvChar = data.results?.[0]
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

// ─── Normaliza ────────────────────────────────────────────────────────────────
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
        try { store.heroes.push(normalizeHero(result.value)) } catch {}
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
  if (!store.loaded) return res.status(503).json({ error: 'Datos aún cargando' })
  next()
}

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.get('/api/universe', ensureLoaded, (req, res) => {
  res.json({ heroes: store.heroes, publishers: store.publishers })
})

app.get('/api/superhero/:id', ensureLoaded, async (req, res) => {
  const hero = store.heroes.find(h => h.id === req.params.id)
  if (!hero) return res.status(404).json({ error: 'Personaje no encontrado' })

  const [comics, movies] = await Promise.all([
    getComicsFromComicVine(hero.name),
    getMoviesFromWikipedia(hero.name),
  ])

  res.json({ ...hero, comics, movies })
})

app.get('/api/status', (req, res) => {
  res.json({
    loaded: store.loaded, loading: store.loading,
    heroes: store.heroes.length,
    apis: {
      superhero: !!SUPERHERO_API_KEY,
      comicvine: !!COMICVINE_API_KEY,
      wikipedia: true,
    }
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Superhero] Puerto ${PORT}`)
  console.log(`  Superhero API : ${SUPERHERO_API_KEY ? '✅' : '❌'}`)
  console.log(`  ComicVine API : ${COMICVINE_API_KEY ? '✅' : '❌'}`)
  console.log(`  Wikipedia     : ✅ (sin key)`)
  loadAllHeroes()
})