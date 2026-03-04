import axios from 'axios';

// En développement  → Vite proxie /api/v1 → localhost:3001
// En production     → VITE_API_URL pointe vers le backend déployé (Railway, Render…)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
