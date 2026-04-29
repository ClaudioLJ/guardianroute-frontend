// src/api/authService.js
import apiClient from "./apiClient";

export async function login({ correo, password }) {
  const response = await apiClient.post("/api/auth/login", {
    correo,
    pwd: password,
  });

  const data = response.data;

  if (!data.ok || !data.token) {
    throw new Error("Respuesta inválida del servidor de autenticación.");
  }

  localStorage.setItem("token", data.token);
  if (data.usuario) {
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
  }

  return data;
}

export async function getMe() {
  const response = await apiClient.get("/api/auth/me");
  return response.data;
}

export async function updateMe(payload) {
  const response = await apiClient.put("/api/auth/me", payload);
  return response.data;
}

export async function forgotPassword(correo) {
  const response = await apiClient.post("/api/auth/forgot-password", {
    correo,
  });
  return response.data;
}

export async function resetPassword({ correo, code, newPwd }) {
  const cleanCorreo = String(correo ?? "").trim();
  const cleanCode = String(code ?? "").trim();
  const cleanPwd = String(newPwd ?? "").trim();

  const body = {
    correo: cleanCorreo,
    codigo: cleanCode,
    newPwd: cleanPwd,
  };

  console.log("✅ resetPassword enviando body:", body);

  const response = await apiClient.post("/api/auth/reset-password", body);
  return response.data;
}
