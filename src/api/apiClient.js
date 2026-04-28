// src/api/apiClient.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const tokenRaw = localStorage.getItem("token");

    if (tokenRaw) {
      // ✅ Limpieza: quita espacios, comillas y un "Bearer " duplicado
      let token = String(tokenRaw).trim();

      // por si se guardó con comillas (raro pero pasa)
      token = token.replace(/^"+|"+$/g, "");

      // si ya trae "Bearer ", lo quitamos para no duplicarlo
      if (token.toLowerCase().startsWith("bearer ")) {
        token = token.slice(7).trim();
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default apiClient;
