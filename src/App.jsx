// src/App.jsx
import React, { useState, useEffect } from "react";
import Registro from "./Registro.jsx";
import Login from "./Login.jsx";
import Recuperar from "./Recuperar.jsx";
import Menu from "./Menu.jsx"; // asegúrate de tener este componente creado

export default function App() {
  const [vista, setVista] = useState("login"); // "registro" | "login" | "recuperar" | "menu"

  const irARegistro = () => setVista("registro");
  const irALogin = () => setVista("login");
  const irARecuperar = () => setVista("recuperar");
  const irAMenu = () => setVista("menu");

  // NUEVO: al cargar la app, revisar si hay token para quedarse en el menú
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setVista("menu");
    }
  }, []);

  if (vista === "login") {
    return (
      <Login
        onGoToRegister={irARegistro}
        onGoToRecover={irARecuperar}
        onLoginSuccess={irAMenu}
      />
    );
  }

  if (vista === "recuperar") {
    return <Recuperar onGoToLogin={irALogin} />;
  }

  if (vista === "registro") {
    return <Registro onGoToLogin={irALogin} />;
  }

  if (vista === "menu") {
    return <Menu onLogout={irALogin} />;
  }

  return null;
}
