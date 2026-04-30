// src/App.jsx
import React, { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Registro from "./Registro.jsx";
import Login from "./Login.jsx";
import Recuperar from "./Recuperar.jsx";
import Menu from "./Menu.jsx";
import Terminos from "./Terminos.jsx";

function LoginPage() {
  const navigate = useNavigate();

  return (
    <Login
      onGoToRegister={() => navigate("/registro")}
      onGoToRecover={() => navigate("/recuperar")}
      onLoginSuccess={() => navigate("/menu")}
    />
  );
}

function RegistroPage() {
  const navigate = useNavigate();

  return (
    <Registro
      onGoToLogin={() => navigate("/")}
      onGoToTerms={() => navigate("/terminos")}
    />
  );
}

function RecuperarPage() {
  const navigate = useNavigate();

  return <Recuperar onGoToLogin={() => navigate("/")} />;
}

function TerminosPage() {
  const navigate = useNavigate();

  return (
    <Terminos
      onGoBack={() => navigate("/registro")}
      onGoToLogin={() => navigate("/")}
    />
  );
}

function MenuPage() {
  const navigate = useNavigate();

  return <Menu onLogout={() => navigate("/")} />;
}

function ProtectedMenuRoute() {
  const token = localStorage.getItem("token");
  return token ? <MenuPage /> : <Navigate to="/" replace />;
}

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentPath = window.location.pathname;

    if (token && (currentPath === "/" || currentPath === "/login")) {
      window.history.replaceState({}, "", "/menu");
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/recuperar" element={<RecuperarPage />} />
      <Route path="/terminos" element={<TerminosPage />} />
      <Route path="/menu" element={<ProtectedMenuRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
