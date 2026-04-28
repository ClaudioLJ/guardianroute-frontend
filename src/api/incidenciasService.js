// src/api/incidenciasService.js
import apiClient from "./apiClient";

// Obtener todas las incidencias de la institución del admin
export async function getAllIncidenciasAdmin() {
  const response = await apiClient.get("/api/admin/incidencias");
  return response.data;
}

// Obtener incidencia por ID de la institución del admin
export async function getIncidenciaAdminById(id) {
  const cleanId = String(id).split(":")[0].trim();
  const response = await apiClient.get(`/api/admin/incidencias/${cleanId}`);
  return response.data;
}

// Editar incidencia de la institución del admin
export async function updateIncidenciaAdmin(id, payload) {
  const cleanId = String(id).split(":")[0].trim();
  const response = await apiClient.put(
    `/api/admin/incidencias/${cleanId}`,
    payload,
  );
  return response.data;
}

// Eliminar incidencia de la institución del admin
export async function deleteIncidenciaAdmin(id) {
  const cleanId = String(id).split(":")[0].trim();
  const response = await apiClient.delete(`/api/admin/incidencias/${cleanId}`);
  return response.data;
}
