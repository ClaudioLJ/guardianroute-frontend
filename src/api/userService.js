import apiClient from "./apiClient";

// Obtener todos los usuarios
export async function getAllUsers() {
  const response = await apiClient.get("/api/admin/users");
  return response.data;
}

// Actualizar usuario
export async function updateUser(id, payload) {
  const cleanId = String(id).split(":")[0].trim();
  const response = await apiClient.put(`/api/admin/users/${cleanId}`, payload);
  return response.data;
}

// Eliminar usuario
export async function deleteUser(id) {
  const cleanId = String(id).split(":")[0].trim();
  const response = await apiClient.delete(`/api/admin/users/${cleanId}`);
  return response.data;
}

// Registrar usuario
export async function registerUser(payload) {
  const response = await apiClient.post("/api/auth/register", payload);
  return response.data;
}
