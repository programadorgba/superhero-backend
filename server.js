require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// API Keys
const SUPERHERO_API_KEY = process.env.SUPERHERO_API_KEY || "";
const COMICVINE_API_KEY = process.env.COMICVINE_API_KEY || "";

const SUPERHERO_BASE = `https://superheroapi.com/api/${SUPERHERO_API_KEY}`;
const COMICVINE_BASE = "https://comicvine.gamespot.com/api";

app.use(cors());
app.use(express.json());



// ========================================
// HELPERS
// ========================================
async function fetchSuperhero(endpoint) {
  try {
    const res = await fetch(`${SUPERHERO_BASE}/${endpoint}`);
    if (!res.ok) throw new Error(`Superhero API error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ Error Superhero API:", error.message);
    throw error;
  }
}

async function fetchComicVine(endpoint, params = {}) {
  try {
    const query = new URLSearchParams({
      api_key: COMICVINE_API_KEY,
      format: "json",
      ...params,
    });
    const res = await fetch(`${COMICVINE_BASE}/${endpoint}?${query}`);
    if (!res.ok) throw new Error(`ComicVine API error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("❌ Error ComicVine API:", error.message);
    throw error;
  }
}

// ========================================
// HEALTH CHECK
// ========================================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "✅ Backend funcionando",
    apis: {
      superhero: !!SUPERHERO_API_KEY,
      comicvine: !!COMICVINE_API_KEY,
    },
  });
});

// ========================================
// RUTA RAÍZ (Health Check para Render)
// ========================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🦸‍♂️ Superhero API funcionando correctamente",
  });
});

// ========================================
// SUPERHERO - BUSCAR POR NOMBRE
// ========================================
app.get("/api/superhero/search/:name", async (req, res) => {
  try {
    const { name } = req.params;
    console.log("🔍 Buscando:", name);

    const data = await fetchSuperhero(`search/${name}`);

    if (data.response === "error") {
      return res
        .status(404)
        .json({ success: false, error: "Personaje no encontrado" });
    }

    const characters = data.results.map((char) => ({
      id: char.id,
      name: char.name,
      image: char.image?.url || "",
      publisher: char.biography?.publisher || "Unknown",
      alignment: char.biography?.alignment || "neutral",
    }));

    res.json({ success: true, data: characters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// SUPERHERO - OBTENER POR ID (COMPLETO)
// ========================================
app.get("/api/superhero/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("👤 Obteniendo personaje:", id);

    const data = await fetchSuperhero(id);

    if (data.response === "error") {
      return res
        .status(404)
        .json({ success: false, error: "Personaje no encontrado" });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// SUPERHERO - POWERSTATS
// ========================================
app.get("/api/superhero/:id/powerstats", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/powerstats`);
    res.json({ success: true, data: data.powerstats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// SUPERHERO - BIOGRAPHY
// ========================================
app.get("/api/superhero/:id/biography", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/biography`);
    res.json({ success: true, data: data.biography });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// SUPERHERO - APPEARANCE
// ========================================
app.get("/api/superhero/:id/appearance", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/appearance`);
    res.json({ success: true, data: data.appearance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// SUPERHERO - WORK
// ========================================
app.get("/api/superhero/:id/work", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/work`);
    res.json({ success: true, data: data.work });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// SUPERHERO - CONNECTIONS
// ========================================
app.get("/api/superhero/:id/connections", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/connections`);
    res.json({ success: true, data: data.connections });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// SUPERHERO - IMAGE
// ========================================
app.get("/api/superhero/:id/image", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchSuperhero(`${id}/image`);
    res.json({ success: true, data: data.image });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// COMICVINE - BUSCAR PERSONAJE
// ========================================
app.get("/api/comicvine/character/:name", async (req, res) => {
  try {
    const { name } = req.params;
    console.log("🔍 Buscando en ComicVine:", name);

    const data = await fetchComicVine("search", {
      query: name,
      resources: "character",
      limit: 10,
    });

    res.json({ success: true, data: data.results || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// COMICVINE - COMICS DEL PERSONAJE
// ========================================
app.get("/api/comicvine/character/:id/issues", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📚 Obteniendo comics del personaje:", id);

    const data = await fetchComicVine(`character/4005-${id}`, {
      field_list: "issue_credits",
    });

    const issues = data.results?.issue_credits || [];

    res.json({ success: true, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// COMICVINE - PELÍCULAS/APARICIONES
// ========================================
app.get("/api/comicvine/character/:id/movies", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🎬 Obteniendo películas del personaje:", id);

    const data = await fetchComicVine(`character/4005-${id}`, {
      field_list: "movies",
    });

    const movies = data.results?.movies || [];

    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// 404
// ========================================
app.use((req, res) => {
  console.log("❌ Ruta no encontrada:", req.method, req.url);
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

// ========================================
// SERVIDOR
// ========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  console.log(
    `✅ Superhero API: ${SUPERHERO_API_KEY ? "Configurada" : "NO configurada"}`,
  );
  console.log(
    `✅ ComicVine API: ${COMICVINE_API_KEY ? "Configurada" : "NO configurada"}`,
  );
});
