// src/api/institucionesService.js
import apiClient from "./apiClient";

export async function createInstitucionAdmin(payload) {
  const response = await apiClient.post("/api/admin/instituciones", payload);
  return response.data;
}
