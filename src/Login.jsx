// src/Login.jsx
import React, { useState } from "react";
import "./Login.css";
import loginImage from "/Imagenes/Login.jpeg";
import logoImage from "/Imagenes/Logo-Fondos-Oscuros.png";

// 👇 nueva importación: usamos la capa de servicios
import { login as apiLogin } from "./api/authService";

export default function Login({
  onGoToRegister,
  onGoToRecover,
  onLoginSuccess,
}) {
  const [form, setForm] = useState({
    correo: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // opcional, para desactivar botón mientras loguea

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      // 👇 usamos la función centralizada
      await apiLogin({
        correo: form.correo,
        password: form.password,
      });

      console.log("Login correcto, entrando al menú...");

      if (onLoginSuccess) onLoginSuccess();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert(error.message || "No se pudo iniciar sesión. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-container">
      <div
        className="login-left"
        style={{ backgroundImage: `url(${loginImage})` }}
      >
        <div className="login-overlay" />
        <div className="login-logo-wrapper">
          <img
            src={logoImage}
            alt="Logo GuardianRoute"
            className="login-logo-img"
          />
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h1 className="login-title">Acceso SuperUsuario</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="correo">Correo Institucional</label>
              <input
                id="correo"
                name="correo"
                type="text"
                value={form.correo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePassword}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? "cerrado" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </button>
          </form>

          <p className="forgot-link">
            <button
              type="button"
              className="link-button"
              onClick={onGoToRecover}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>

          <p className="forgot-link">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              className="link-button"
              onClick={onGoToRegister}
            >
              Crear cuenta
            </button>
          </p>

          <p className="login-footer-text">
            GuardianRoute - Sistema de supervisión inteligente
          </p>
        </div>
      </div>
    </div>
  );
}
