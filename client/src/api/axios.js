import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL || " https://day-love-server.onrender.com";
const baseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

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