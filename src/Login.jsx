// src/Login.jsx
import React, { useState } from "react";
import "./Login.css";
import loginImage from "/Imagenes/Login.jpeg";
import logoImage from "/Imagenes/Logo-Fondos-Oscuros.png";
import { login as apiLogin } from "./api/authService";

function EyeOpenIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12C3.8 8.5 7.4 6 12 6C16.6 6 20.2 8.5 22 12C20.2 15.5 16.6 18 12 18C7.4 18 3.8 15.5 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.7C10.2 11.05 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 12.95 13.8 13.3 13.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.7 6.8C5 8 3.7 9.7 2.9 12C4.7 15.5 8 18 12 18C13.9 18 15.7 17.4 17.2 16.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 5.2C10.6 5.1 11.3 5 12 5C16.6 5 20.2 7.5 22 11C21.5 12 20.9 12.9 20.2 13.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
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
                  title={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
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
