import axios from "axios";

// ប្រើ replace ដើមី្បលុប trailing slash (/) ប្រសិនបើមាន
const rawBaseURL = import.meta.env.VITE_API_URL || "https://day-love-server.onrender.com";
const baseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("day_life_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;