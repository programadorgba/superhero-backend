require('dotenv').config();

const SUPERHERO_API_KEY = process.env.SUPERHERO_API_KEY || '';

module.exports = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  SUPERHERO_API_KEY: SUPERHERO_API_KEY,
  COMICVINE_API_KEY: process.env.COMICVINE_API_KEY || '',
  SUPERHERO_BASE_URL: `https://www.superheroapi.com/api.php/${SUPERHERO_API_KEY}`
};