require('dotenv').config();

const SUPERHERO_API_KEY = process.env.SUPERHERO_API_KEY || '';

// Validación temprana
if (!SUPERHERO_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  SUPERHERO_API_KEY no configurada en .env');
}

module.exports = {
  PORT: process.env.PORT || 3000,
  SUPERHERO_API_KEY,
  COMICVINE_API_KEY: process.env.COMICVINE_API_KEY || '',
  SUPERHERO_BASE_URL: `https://www.superheroapi.com/api.php/${SUPERHERO_API_KEY}`,
  
  // Método para validar
  validateConfig: function() {
    if (!SUPERHERO_API_KEY) {
      throw new Error('SUPERHERO_API_KEY no configurada en variables de entorno');
    }
    return true;
  }
};