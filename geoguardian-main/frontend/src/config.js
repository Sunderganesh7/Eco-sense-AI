// frontend/src/config.js
// Create this file to manage API URLs

const rawApiUrl = (process.env.REACT_APP_API_URL || "https://geoguardian-api1.onrender.com").replace(/\/+$/, '');
// Strip trailing /api if provided by mistake, because components append /api/...
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;

const config = {
  API_URL,
  MAIN_PORTAL_URL: process.env.REACT_APP_MAIN_PORTAL_URL || "https://eco-sense-ai-beta.vercel.app",
};

export default config;

// Usage in your components:
// import config from './config';
// axios.get(`${config.API_URL}/api/nasa/image`)