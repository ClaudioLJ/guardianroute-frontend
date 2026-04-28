import React, { useState } from "react";
import "./Registro.css";
import registerImage from "/Imagenes/Registro.jpeg";
import logoImage from "/Imagenes/Logo-Fondos-Oscuros.png";

export default function Registro({ onGoToLogin }) {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmarPassword: "",
    aceptaTerminos: false,
  });

  const [showTerms, setShowTerms] = useState(false);

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
              <button
                type="button"
                className="terms-toggle-button"
                onClick={() => setShowTerms((prev) => !prev)}
              >
                {showTerms
                  ? "Ocultar términos y condiciones"
                  : "Ver términos y condiciones"}
              </button>

              {showTerms && (
                <div className="terms-box">
                  <h3>Términos y Condiciones de Uso de GuardianRoute</h3>

                  <p>
                    Bienvenido a GuardianRoute. Al registrarse como
                    SuperUsuario, administrador o usuario autorizado dentro de
                    esta plataforma, usted acepta cumplir con los presentes
                    términos y condiciones, así como con las políticas internas
                    de su institución.
                  </p>

                  <p>
                    <strong>1. Objeto del sistema.</strong> GuardianRoute es una
                    plataforma tecnológica orientada a la supervisión
                    inteligente, gestión de mapas, registro de incidencias,
                    simulacros, puntos de salida, beacons y apoyo a procesos de
                    seguridad institucional. Su propósito es facilitar la
                    administración de información relacionada con rutas,
                    estructuras, monitoreo y eventos internos.
                  </p>

                  <p>
                    <strong>2. Uso autorizado.</strong> El acceso al sistema
                    está limitado a personas autorizadas por la institución. El
                    usuario se compromete a utilizar la plataforma únicamente
                    para fines legítimos, institucionales, académicos,
                    administrativos o de seguridad, y no para actividades que
                    comprometan la integridad del sistema o de terceros.
                  </p>

                  <p>
                    <strong>3. Veracidad de la información.</strong> El usuario
                    declara que la información proporcionada durante el registro
                    y durante el uso del sistema es verídica, actualizada y
                    completa. El usuario reconoce que proporcionar datos falsos,
                    incompletos o inexactos puede ocasionar restricciones de
                    acceso, suspensión de cuenta o responsabilidades
                    administrativas.
                  </p>

                  <p>
                    <strong>4. Responsabilidad sobre la cuenta.</strong> El
                    usuario es responsable de la confidencialidad de sus
                    credenciales de acceso. No deberá compartir su contraseña,
                    permitir el acceso a terceros no autorizados ni utilizar
                    cuentas ajenas. Toda actividad realizada desde su cuenta se
                    considerará efectuada bajo su responsabilidad.
                  </p>

                  <p>
                    <strong>5. Privacidad y tratamiento de datos.</strong> La
                    información registrada en GuardianRoute puede incluir datos
                    personales, datos institucionales, mapas, imágenes,
                    registros de incidencias, puntos de evacuación y otra
                    información relacionada con seguridad operativa. Dicha
                    información será utilizada exclusivamente para fines
                    funcionales, administrativos, académicos, institucionales y
                    de protección interna, conforme a la normativa y
                    lineamientos aplicables.
                  </p>

                  <p>
                    <strong>6. Contenido cargado al sistema.</strong> El usuario
                    garantiza que los archivos, imágenes, mapas, registros y
                    demás contenidos que cargue al sistema cuentan con
                    autorización para su uso institucional y no vulneran
                    derechos de terceros. El usuario se obliga a no cargar
                    contenido ilícito, ofensivo, engañoso, malicioso o ajeno a
                    la finalidad de la plataforma.
                  </p>

                  <p>
                    <strong>7. Uso de mapas, beacons y rutas.</strong> Los
                    registros de planos, mapas, salidas, beacons, simulacros e
                    incidencias deben reflejar la realidad operativa de la
                    institución en la medida de lo posible. GuardianRoute es una
                    herramienta de apoyo; por lo tanto, el usuario reconoce que
                    la correcta interpretación, validación y ejecución de
                    protocolos de seguridad sigue siendo responsabilidad humana
                    e institucional.
                  </p>

                  <p>
                    <strong>8. Disponibilidad del servicio.</strong> Aunque se
                    busca mantener la plataforma disponible y funcionando de
                    manera continua, no se garantiza la ausencia total de
                    interrupciones, errores, retrasos, fallos de red o eventos
                    fuera de control técnico. GuardianRoute podrá ser
                    actualizado, corregido, suspendido o modificado cuando sea
                    necesario.
                  </p>

                  <p>
                    <strong>9. Limitación de responsabilidad.</strong> El
                    sistema se proporciona como una herramienta de apoyo. Los
                    desarrolladores, responsables académicos o administradores
                    de GuardianRoute no serán responsables por daños derivados
                    del uso incorrecto del sistema, captura errónea de
                    información, interpretación inadecuada de datos, omisiones
                    humanas o decisiones operativas tomadas exclusivamente con
                    base en la plataforma.
                  </p>

                  <p>
                    <strong>10. Seguridad del sistema.</strong> Queda prohibido
                    intentar vulnerar, alterar, desactivar, copiar, duplicar,
                    extraer, manipular, hacer ingeniería inversa o afectar el
                    funcionamiento normal de GuardianRoute, sus bases de datos,
                    servicios conectados, APIs, archivos o integraciones. Toda
                    acción de este tipo podrá derivar en cancelación de acceso y
                    reporte ante la institución correspondiente.
                  </p>

                  <p>
                    <strong>11. Suspensión o cancelación de acceso.</strong> La
                    administración del sistema podrá suspender o cancelar
                    cuentas cuando detecte uso indebido, incumplimiento de estos
                    términos, riesgos de seguridad, actividad sospechosa o
                    conductas que afecten la operación de la plataforma o de la
                    institución.
                  </p>

                  <p>
                    <strong>12. Propiedad intelectual.</strong> El diseño,
                    estructura, código, arquitectura visual, documentación y
                    demás elementos de GuardianRoute forman parte del desarrollo
                    del sistema y no podrán ser reproducidos, distribuidos o
                    explotados sin autorización correspondiente, salvo en los
                    casos permitidos por el proyecto académico o institucional.
                  </p>

                  <p>
                    <strong>13. Aceptación expresa.</strong> Al seleccionar la
                    casilla de aceptación y registrarse en la plataforma, el
                    usuario manifiesta haber leído, entendido y aceptado estos
                    términos y condiciones en su totalidad.
                  </p>

                  <p>
                    <strong>14. Cambios en los términos.</strong> Estos términos
                    y condiciones podrán actualizarse en cualquier momento para
                    reflejar mejoras del sistema, cambios institucionales o
                    necesidades legales, técnicas o académicas. El uso continuo
                    de la plataforma después de una actualización implicará la
                    aceptación de la versión vigente.
                  </p>
                </div>
              )}

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={form.aceptaTerminos}
                  onChange={handleChange}
                />
                <span>
                  He leído y acepto los términos y condiciones de GuardianRoute
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
