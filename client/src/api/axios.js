import axios from "axios";

// ប្រើ replace ដើម្បីលុប trailing slash (/) ប្រសិនបើមាន
const rawBaseURL = import.meta.env.VITE_API_URL || "https://day-love-server.onrender.com";
const baseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  timeout: 60000, // ⏳ បន្ថែម Timeout ៦០ វិនាទី ដើម្បីរង់ចាំ Render Free Tier Cold Start
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor (ដាក់ JWT Token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("day_life_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (ចាប់ Error ឱ្យច្បាស់ មិនឱ្យកក Loading)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error("Server ឆ្លើយតបយូរពេក (Timeout) - សូមព្យាយាមម្ដងទៀត!");
    }
    return Promise.reject(error);
  }
);

export default api;