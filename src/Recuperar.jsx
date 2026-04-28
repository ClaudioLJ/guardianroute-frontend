// src/Recuperar.jsx
import React, { useState } from "react";
import "./Recuperar.css";
import logoImage from "/Imagenes/Logo-Fondos-Oscuros.png";
import pinImage from "/Imagenes/Pin-Ubicacion.png";
import { forgotPassword, resetPassword } from "./api/authService";

export default function Recuperar({ onGoToLogin }) {
  const [step, setStep] = useState(1);

  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState(""); // este será el code del correo

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  const [loading, setLoading] = useState(false);

  const goBack = () => {
    if (step === 1) return;

    if (step === 2) {
      setCodigo("");
      setStep(1);
      return;
    }

    if (step === 3) {
      setPwd("");
      setPwd2("");
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (step === 1) {
        const res = await forgotPassword(correo.trim());
        console.log("forgot-password response:", res);

        alert("Si el correo existe, te enviamos un código.");
        setStep(2);
        return;
      }

      if (step === 2) {
        if (!codigo.trim()) {
          alert("Ingresa el código que te llegó al correo.");
          return;
        }
        setStep(3);
        return;
      }

      if (step === 3) {
        if (pwd.length < 6) {
          alert("La contraseña debe tener al menos 6 caracteres.");
          return;
        }
        if (pwd !== pwd2) {
          alert("Las contraseñas no coinciden.");
          return;
        }

        // 🔎 Debug previo
        console.log("✅ Enviando reset-password con:", {
          correo: correo.trim(),
          code: codigo.trim(),
          newPwd: pwd,
        });

        const res = await resetPassword({
          correo: correo.trim(),
          code: codigo.trim(),
          newPwd: pwd,
        });

        console.log("reset-password response:", res);

        alert("Contraseña actualizada. Ahora puedes iniciar sesión.");
        onGoToLogin?.();
      }
    } catch (error) {
      console.error("Error en recuperación:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Error desconocido";
      alert(`Ocurrió un error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const title =
    step === 1
      ? "Recuperar contraseña"
      : step === 2
        ? "Ingresar código"
        : "Nueva contraseña";

  const primaryButton =
    step === 1
      ? "Enviar enlace"
      : step === 2
        ? "Continuar"
        : "Guardar contraseña";

  return (
    <div className="recovery-container">
      <div className="recovery-path" />

      <div className="recovery-pin">
        <img
          src={pinImage}
          alt="Ubicación GuardianRoute"
          className="recovery-pin-img"
        />
      </div>

      <header className="recovery-header">
        <img
          src={logoImage}
          alt="Logo GuardianRoute"
          className="recovery-logo"
        />
      </header>

      <div className="recovery-inner">
        <main className="recovery-card">
          <h1 className="recovery-title">{title}</h1>

          {step === 2 && (
            <p style={{ opacity: 0.85, marginBottom: 14 }}>
              Te enviamos un código a: <strong>{correo}</strong>
            </p>
          )}

          {step === 3 && (
            <p style={{ opacity: 0.85, marginBottom: 14 }}>
              Cuenta: <strong>{correo}</strong>
            </p>
          )}

          <form className="recovery-form" onSubmit={handleSubmit}>
            {step === 1 && (
              <input
                id="correo"
                name="correo"
                type="email"
                placeholder="Correo Electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className="recovery-input"
                disabled={loading}
              />
            )}

            {step === 2 && (
              <input
                id="codigo"
                name="codigo"
                type="text"
                placeholder="Código que llegó a tu correo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                className="recovery-input"
                disabled={loading}
              />
            )}

            {step === 3 && (
              <>
                <input
                  id="pwd"
                  name="pwd"
                  type="password"
                  placeholder="Nueva contraseña"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  className="recovery-input"
                  disabled={loading}
                />

                <input
                  id="pwd2"
                  name="pwd2"
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  required
                  className="recovery-input"
                  disabled={loading}
                />
              </>
            )}

            <button
              type="submit"
              className="recovery-button"
              disabled={loading}
            >
              {loading ? "Procesando..." : primaryButton}
            </button>
          </form>

          {step === 1 ? (
            <button
              type="button"
              className="recovery-back link-button"
              onClick={onGoToLogin}
              disabled={loading}
            >
              Volver a iniciar sesión
            </button>
          ) : (
            <button
              type="button"
              className="recovery-back link-button"
              onClick={goBack}
              disabled={loading}
            >
              Volver
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
