/*Registro*/
import React, { useState } from "react";
import "./Registro.css";
import registerImage from "/Imagenes/Registro.jpeg";
import logoImage from "/Imagenes/Logo-Fondos-Oscuros.png";

export default function Registro({ onGoToLogin, onGoToTerms }) {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmarPassword: "",
    aceptaTerminos: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmarPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    if (!form.aceptaTerminos) {
      alert("Debes aceptar los términos y condiciones para registrarte.");
      return;
    }

    console.log("Datos del formulario:", form);

    alert("Registro validado correctamente.");
  };

  return (
    <div className="register-container">
      <div
        className="register-left"
        style={{ backgroundImage: `url(${registerImage})` }}
      >
        <div className="register-overlay" />
        <div className="logo-wrapper">
          <img src={logoImage} alt="Logo GuardianRoute" className="logo-img" />
        </div>
      </div>

      <div className="register-right">
        <div className="register-card">
          <h1 className="register-title">Crear cuenta de SuperUsuario</h1>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo Institucional</label>
              <input
                id="correo"
                name="correo"
                type="email"
                value={form.correo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmarPassword">Confirmar contraseña</label>
              <input
                id="confirmarPassword"
                name="confirmarPassword"
                type="password"
                value={form.confirmarPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="terms-section">
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={form.aceptaTerminos}
                  onChange={handleChange}
                />
                <span>
                  He leído y acepto los{" "}
                  <button
                    type="button"
                    className="link-button"
                    onClick={onGoToTerms}
                  >
                    términos y condiciones
                  </button>{" "}
                  de GuardianRoute
                </span>
              </label>
            </div>

            <button type="submit" className="btn-submit">
              Registrarme
            </button>
          </form>

          <p className="login-link">
            ¿Ya tienes una cuenta?{" "}
            <button type="button" className="link-button" onClick={onGoToLogin}>
              Inicia sesión
            </button>
          </p>

          <p className="footer-text">
            GuardianRoute - Sistema de supervisión inteligente
          </p>
        </div>
      </div>
    </div>
  );
}
