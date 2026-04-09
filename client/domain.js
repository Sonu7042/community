const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://community-kefs.vercel.app/api');

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL_Auth = `${API_BASE_URL}/auth`;
