import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Menu.css";
import logoDark from "/Imagenes/Logo-Fondos-Oscuros.png";
import logoLight from "/Imagenes/Logo-Fondos-Claros.png";
import defaultMapImage from "/Imagenes/Mapa-Actual.png";

import apiClient from "./api/apiClient";
import {
  getSimulacrosHistorialByInstitution,
  getBeaconCatalogByInstitution,
  getCurrentSimulacroStateByInstitution,
  buildSimulacroAnalytics,
  startSimulacroTimer,
  finishSimulacroTimer,
} from "./api/simulacrosFirebaseService";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  registerUser,
} from "./api/userService";
import {
  getAllIncidenciasAdmin,
  updateIncidenciaAdmin,
  deleteIncidenciaAdmin,
} from "./api/incidenciasService";
import { createInstitucionAdmin } from "./api/institucionesService";

const DRILL_ENDPOINT =
  "https://u0odar8a7d.execute-api.us-east-1.amazonaws.com/Prod/handleDrill";
const COPY_IMAGE_ENDPOINT =
  "https://v0uwt9hys4.execute-api.us-east-1.amazonaws.com/Prod/copyimage";
const PRESIGNED_ENDPOINT =
  "https://lmu8yrg3sd.execute-api.us-east-1.amazonaws.com/Prod/generateUrl";
const GET_IMAGE_ENDPOINT =
  "https://chil3210v3.execute-api.us-east-1.amazonaws.com/Prod/generateImgUrl";

const EMPTY_MAP_FORM = {
  nombre: "",
  tipo: "campus",
  parentId: "",
  descripcion: "",
};

const EMPTY_BEACON_FORM = {
  nombre: "",
  estatus: "ACTIVO",
};

const EMPTY_USER = {
  id: "",
  nombres: "",
  telefono: "",
  edad: "",
  correo: "",
  pwd: "Guardian123*",
  activo: true,
};

const EMPTY_INCIDENCIA = {
  id: "",
  piso: "",
  incidente: "",
  cantidad_heridos: 0,
  fecha: "",
  hora: "",
  estatus: "Pendiente",
};

const ESTATUS_INCIDENCIAS = ["Pendiente", "En progreso", "Atendido"];

const INITIAL_SIMULACROS = [
  {
    id: 1,
    nombre: "Simulacro 1",
    fechaProgramada: "16/04/2025",
    horaProgramada: "17:15 pm",
    zonasBloqueadas: 2,
    zonas: "Zona A, Zona B",
    tipo: "Incendio",
    responsable: "Coordinador de Seguridad",
    puntoEncuentro: "Estacionamiento principal",
    descripcion:
      "Simulacro de evacuación por incendio en el edificio administrativo principal.",
  },
  {
    id: 2,
    nombre: "Simulacro 2",
    fechaProgramada: "18/04/2025",
    horaProgramada: "17:05 pm",
    zonasBloqueadas: 3,
    zonas: "Zona C, Zona D, Zona E",
    tipo: "Sismo",
    responsable: "Jefe de Operaciones",
    puntoEncuentro: "Patio central",
    descripcion:
      "Simulacro general por sismo con participación de todo el personal de la planta.",
  },
];

const EMPTY_SIMULACRO = {
  nombre: "",
  fechaProgramada: "",
  horaProgramada: "",
  zonasBloqueadas: "",
  zonas: "",
  tipo: "",
  responsable: "",
  puntoEncuentro: "",
  descripcion: "",
};

const mapInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  outline: "none",
  background: "rgba(255,255,255,0.96)",
  color: "#111",
  fontSize: "0.95rem",
};

const mapMetaText = {
  margin: "0 0 10px 0",
  color: "#fff",
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const primaryActionStyle = {
  padding: "14px 18px",
  borderRadius: "999px",
  border: "none",
  background: "#00B388",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryActionStyle = {
  padding: "14px 18px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const cardStyle = {
  background: "rgba(8, 18, 45, 0.88)",
  borderRadius: "22px",
  padding: "22px",
  border: "1px solid rgba(255,255,255,0.08)",
};

function safeParseLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeZonaIdentifier(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[/%#?&+=]/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function resolveInstitutionIdFromUser(currentUser) {
  return (
    currentUser?.institucion_id ||
    currentUser?.institution_id ||
    currentUser?.institucion?.id ||
    currentUser?.institution?.id ||
    currentUser?.id_institucion ||
    1
  );
}

function prettifyZonaIdentificador(value) {
  const text = String(value || "").trim();
  if (!text) return "Mapa";
  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferTipoFromZona(value) {
  const text = normalizeZonaIdentifier(value);

  if (text.includes("plano general") || text.includes("campus"))
    return "campus";
  if (text.includes("edificio")) return "edificio";
  if (
    text.includes("piso") ||
    text.includes("planta baja") ||
    text.includes("primer piso")
  ) {
    return "piso";
  }
  if (text.includes("area")) return "area";
  return "otro";
}

function normalizeAdminMapRecord(item) {
  const zona = item?.zona_identificador || "";
  return {
    id: String(item?.id ?? crypto.randomUUID()),
    mapa_id: item?.id ?? null,
    mapaId: item?.id ?? null,
    nombre: prettifyZonaIdentificador(zona),
    tipo: inferTipoFromZona(zona),
    parentId: "",
    descripcion: "",
    key: item?.imagen_key || "",
    imageUrl: "",
    fileName: "",
    hierarchyLabel: prettifyZonaIdentificador(zona),
    backendZonaIdentificador: normalizeZonaIdentifier(zona),
    institucion_id: item?.institucion_id ?? null,
    backendSynced: true,
  };
}

async function syncSimulacroImages(institutionId, state) {
  const response = await fetch(COPY_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      institucion_id: institutionId,
      state,
    }),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        (typeof data === "string" ? data : null) ||
        "No se pudo ejecutar la sincronización de imágenes del simulacro.",
    );
  }

  return data;
}

export default function Menu({ onLogout }) {
  const [activeSection, setActiveSection] = useState("menu");
  const [theme, setTheme] = useState("dark");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [currentMapUrl, setCurrentMapUrl] = useState(defaultMapImage);
  const [currentMapKey, setCurrentMapKey] = useState("");
  const [currentMapFileName, setCurrentMapFileName] = useState("");
  const [currentMapLabel, setCurrentMapLabel] = useState("Mapa principal");

  const [currentUser] = useState(() => getStoredUser());

  const userName =
    currentUser?.nombres || currentUser?.nombre || "Administrador actual";
  const userEmail =
    currentUser?.correo || currentUser?.email || "correo@ejemplo.com";

  const handleLogout = () => {
    setShowProfileMenu(false);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    if (onLogout) onLogout();
    else window.location.href = "/";
  };

  const handleChangeAdmin = () => {
    const confirmar = window.confirm(
      "Para cambiar de administrador necesitas cerrar sesión y volver a iniciar con otra cuenta.\n\n¿Quieres cerrar sesión ahora?",
    );
    if (confirmar) handleLogout();
  };

  return (
    <div
      className={`menu-layout ${theme === "light" ? "theme-light" : "theme-dark"}`}
    >
      <aside className="menu-sidebar">
        <div className="sidebar-logo">
          <img
            src={theme === "dark" ? logoDark : logoLight}
            alt="Logo GuardianRoute"
            className="sidebar-logo-img"
          />
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === "menu" ? "nav-item-active" : ""}`}
            onClick={() => setActiveSection("menu")}
          >
            Menu
          </button>
          <button
            className={`nav-item ${activeSection === "mapa" ? "nav-item-active" : ""}`}
            onClick={() => setActiveSection("mapa")}
          >
            Mapa
          </button>
          <button
            className={`nav-item ${activeSection === "usuarios" ? "nav-item-active" : ""}`}
            onClick={() => setActiveSection("usuarios")}
          >
            Usuarios
          </button>
          <button
            className={`nav-item ${activeSection === "simulacros" ? "nav-item-active" : ""}`}
            onClick={() => setActiveSection("simulacros")}
          >
            Simulacros
          </button>
          <button
            className={`nav-item ${activeSection === "incidentes" ? "nav-item-active" : ""}`}
            onClick={() => setActiveSection("incidentes")}
          >
            Incidentes
          </button>
          <button
            className={`nav-item ${activeSection === "ajustes" ? "nav-item-active" : ""}`}
            onClick={() => setActiveSection("ajustes")}
          >
            Ajustes
          </button>
        </nav>
      </aside>

      <main className="menu-main">
        <div className="menu-stripes" />

        <header className="menu-topbar">
          <h1 className="menu-title">
            {activeSection === "menu" && "MENU"}
            {activeSection === "mapa" && "GESTIÓN DE MAPAS"}
            {activeSection === "usuarios" && "USUARIOS"}
            {activeSection === "simulacros" && "SIMULACROS"}
            {activeSection === "incidentes" && "INCIDENTES"}
            {activeSection === "ajustes" && "AJUSTES"}
          </h1>

          <div className="profile-wrapper">
            <button
              className="profile-button"
              type="button"
              onClick={() => setShowProfileMenu((v) => !v)}
            >
              <span className="profile-icon">👤</span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <p className="profile-name">{userName}</p>
                  <p className="profile-email">{userEmail}</p>
                </div>
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={handleChangeAdmin}
                >
                  Cambiar administrador
                </button>
                <button
                  type="button"
                  className="profile-dropdown-item profile-dropdown-logout"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="menu-content">
          {activeSection === "menu" && (
            <MenuHome
              mapImage={currentMapUrl || defaultMapImage}
              mapLabel={currentMapLabel}
            />
          )}
          {activeSection === "mapa" && (
            <MapaSection
              currentUser={currentUser}
              currentMapUrl={currentMapUrl}
              currentMapKey={currentMapKey}
              currentMapFileName={currentMapFileName}
              currentMapLabel={currentMapLabel}
              setCurrentMapUrl={setCurrentMapUrl}
              setCurrentMapKey={setCurrentMapKey}
              setCurrentMapFileName={setCurrentMapFileName}
              setCurrentMapLabel={setCurrentMapLabel}
            />
          )}
          {activeSection === "usuarios" && <UsuariosSection />}
          {activeSection === "simulacros" && (
            <SimulacrosSection currentUser={currentUser} />
          )}
          {activeSection === "incidentes" && <IncidentesSection />}
          {activeSection === "ajustes" && (
            <AjustesSection theme={theme} setTheme={setTheme} />
          )}
        </section>
      </main>
    </div>
  );
}

function MenuHome({ mapImage, mapLabel }) {
  return (
    <>
      <div className="map-header">
        <h2 className="map-title">{mapLabel || "Tu Mapa Actual"}</h2>
        <span className="map-pin-icon" role="img" aria-label="Ubicación actual">
          📍
        </span>
      </div>

      <div
        className="map-card map-card-big"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px",
          minHeight: "520px",
          overflow: "hidden",
        }}
      >
        <img
          src={mapImage}
          alt="Mapa actual de la estructura"
          className="map-image map-image-big"
          style={{
            maxWidth: "90%",
            maxHeight: "82vh",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            borderRadius: "12px",
            display: "block",
          }}
        />
      </div>
    </>
  );
}

function MapaSection({
  currentUser,
  currentMapUrl,
  currentMapKey,
  currentMapFileName,
  currentMapLabel,
  setCurrentMapUrl,
  setCurrentMapKey,
  setCurrentMapFileName,
  setCurrentMapLabel,
}) {
  const [uploading, setUploading] = useState(false);
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [loadingMaps, setLoadingMaps] = useState(true);

  const [formMap, setFormMap] = useState(EMPTY_MAP_FORM);
  const [mapRecords, setMapRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");

  const [selectedMapDetail, setSelectedMapDetail] = useState(null);
  const [loadingMapDetail, setLoadingMapDetail] = useState(false);
  const [beacons, setBeacons] = useState([]);
  const [beaconMode, setBeaconMode] = useState(false);
  const [pendingBeaconPoint, setPendingBeaconPoint] = useState(null);
  const [beaconForm, setBeaconForm] = useState(EMPTY_BEACON_FORM);
  const [savingBeacon, setSavingBeacon] = useState(false);

  const imageRef = useRef(null);
  const institutionId = resolveInstitutionIdFromUser(currentUser);

  const selectedRecord = useMemo(
    () => mapRecords.find((item) => item.id === selectedRecordId) || null,
    [mapRecords, selectedRecordId],
  );

  const topLevelRecords = useMemo(() => mapRecords, [mapRecords]);

  const getResolvedMapaId = () => {
    return (
      selectedMapDetail?.mapa_id ||
      selectedMapDetail?.mapaId ||
      selectedMapDetail?.id ||
      selectedRecord?.mapa_id ||
      selectedRecord?.mapaId ||
      null
    );
  };

  const getImageUrlFromKey = async (key) => {
    try {
      const response = await fetch(GET_IMAGE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return (
        data?.url ||
        data?.imageUrl ||
        data?.downloadUrl ||
        data?.signedUrl ||
        data?.presignedUrl ||
        data?.body?.url ||
        data?.body?.imageUrl ||
        null
      );
    } catch {
      return null;
    }
  };

  const loadAdminMaps = async () => {
    setLoadingMaps(true);
    try {
      const response = await apiClient.get("/api/admin/instituciones/mapas");
      const rawMaps = response?.data?.mapas || response?.data || [];
      const normalized = Array.isArray(rawMaps)
        ? rawMaps.map(normalizeAdminMapRecord)
        : [];

      setMapRecords(normalized);

      if (normalized.length === 0) {
        setSelectedRecordId("");
        setSelectedMapDetail(null);
        setBeacons([]);
        setCurrentMapUrl(defaultMapImage);
        setCurrentMapKey("");
        setCurrentMapFileName("");
        setCurrentMapLabel("Mapa principal");
        return normalized;
      }

      const stillExists = normalized.find((m) => m.id === selectedRecordId);
      const target = stillExists || normalized[0];

      setSelectedRecordId(target.id);
      setCurrentMapKey(target.key || "");
      setCurrentMapFileName("");
      setCurrentMapLabel(target.nombre || "Mapa principal");

      const freshUrl = target.key ? await getImageUrlFromKey(target.key) : null;
      setCurrentMapUrl(freshUrl || defaultMapImage);

      return normalized;
    } catch (error) {
      console.error("Error cargando lista de mapas:", error);
      alert(
        `No se pudo cargar la lista de mapas:
${
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Error desconocido"
}`,
      );
      setMapRecords([]);
      return [];
    } finally {
      setLoadingMaps(false);
    }
  };

  useEffect(() => {
    loadAdminMaps();
  }, [institutionId]);

  const loadMapDetail = async (record) => {
    if (!record || !institutionId) {
      setSelectedMapDetail(null);
      setBeacons([]);
      return null;
    }

    setLoadingMapDetail(true);
    try {
      const zonaRaw =
        record.backendZonaIdentificador ||
        normalizeZonaIdentifier(record.hierarchyLabel || record.nombre);

      const response = await apiClient.get(
        `/api/instituciones/${institutionId}/mapa/${zonaRaw}`,
      );

      const data = response?.data || null;
      setSelectedMapDetail(data);
      setBeacons(Array.isArray(data?.beacons) ? data.beacons : []);

      setMapRecords((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                mapa_id:
                  data?.mapa_id || data?.mapaId || data?.id || item.mapa_id,
                mapaId:
                  data?.mapa_id || data?.mapaId || data?.id || item.mapaId,
              }
            : item,
        ),
      );

      return data;
    } catch (error) {
      setSelectedMapDetail(null);
      setBeacons([]);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "No se pudo cargar el detalle del mapa.";
      alert(`No se pudo cargar mapa y beacons:
${msg}`);
      return null;
    } finally {
      setLoadingMapDetail(false);
    }
  };

  useEffect(() => {
    const bootstrapSelection = async () => {
      if (!selectedRecord) return;
      await loadMapDetail(selectedRecord);
    };

    bootstrapSelection();
  }, [selectedRecordId]);

  const uploadToS3 = async (file) => {
    if (!file || !file.type?.startsWith("image/")) {
      alert("Solo se permiten imágenes.");
      return null;
    }

    setUploading(true);
    try {
      const presignedResponse = await fetch(PRESIGNED_ENDPOINT, {
        method: "POST",
      });

      if (!presignedResponse.ok) {
        throw new Error("No se pudo obtener la URL firmada.");
      }

      const presignedData = await presignedResponse.json();
      const uploadUrl = presignedData?.uploadUrl;
      const key = presignedData?.key;

      if (!uploadUrl || !key) {
        throw new Error("La API no devolvió uploadUrl o key.");
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("No se pudo subir la imagen a S3.");
      }

      const imageUrl = await getImageUrlFromKey(key);
      if (!imageUrl) {
        throw new Error("No se pudo recuperar la URL de la imagen.");
      }

      return { key, imageUrl };
    } catch (error) {
      alert(error?.message || "Ocurrió un error al subir la imagen.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const saveInstitucionRecord = async ({ backendZonaIdentificador, key }) => {
    setSavingInstitution(true);
    try {
      const payload = {
        zona_identificador: backendZonaIdentificador,
        imagen_key: key,
      };

      await createInstitucionAdmin(payload);
      return { ok: true };
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "No se pudo registrar la imagen.";

      if (
        error?.response?.status === 409 ||
        String(msg).toUpperCase().includes("YA_EXISTE")
      ) {
        return { ok: true, alreadyExists: true };
      }

      alert(
        `La imagen sí se subió a S3, pero falló el registro en backend:
${msg}`,
      );
      return { ok: false };
    } finally {
      setSavingInstitution(false);
    }
  };

  const handleCreateMapRecord = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nombre = formMap.nombre.trim();
    if (!nombre) {
      alert("Escribe el nombre de la zona.");
      event.target.value = "";
      return;
    }

    const backendZonaIdentificador = normalizeZonaIdentifier(nombre);

    const uploadResult = await uploadToS3(file);
    if (!uploadResult) {
      event.target.value = "";
      return;
    }

    const backendResult = await saveInstitucionRecord({
      backendZonaIdentificador,
      key: uploadResult.key,
    });

    if (!backendResult?.ok) {
      event.target.value = "";
      return;
    }

    const refreshed = await loadAdminMaps();
    const targetRecord =
      refreshed.find(
        (item) => item.backendZonaIdentificador === backendZonaIdentificador,
      ) || null;

    if (targetRecord?.id) {
      setSelectedRecordId(targetRecord.id);
      setCurrentMapKey(targetRecord.key || uploadResult.key);
      setCurrentMapFileName("");
      setCurrentMapLabel(targetRecord.nombre || "Mapa principal");
      setCurrentMapUrl(uploadResult.imageUrl || defaultMapImage);
      await loadMapDetail(targetRecord);
    }

    setFormMap(EMPTY_MAP_FORM);
    event.target.value = "";
  };

  const handleSelectRecord = async (record) => {
    setSelectedRecordId(record.id);
    setCurrentMapKey(record.key || "");
    setCurrentMapFileName("");
    setCurrentMapLabel(record.nombre || "Mapa");
    setBeaconMode(false);
    setPendingBeaconPoint(null);
    setBeaconForm(EMPTY_BEACON_FORM);

    const freshUrl = record.key ? await getImageUrlFromKey(record.key) : null;
    setCurrentMapUrl(freshUrl || defaultMapImage);

    await loadMapDetail(record);
  };

  const handleDeleteLocalRecord = () => {
    alert(
      "Esta opción ya no debe usarse como fuente oficial. Los mapas ahora deben gestionarse desde backend.",
    );
  };

  const handleImageClickForBeacon = (e) => {
    if (!beaconMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    setPendingBeaconPoint({ x, y });
  };

  const handleSaveBeacon = async () => {
    const mapaId = getResolvedMapaId();

    if (!mapaId) {
      alert("No se encontró mapa_id para este mapa.");
      return;
    }

    if (!pendingBeaconPoint) {
      alert("Primero da clic en el mapa para colocar el beacon.");
      return;
    }

    if (!beaconForm.nombre.trim()) {
      alert("Escribe el nombre del beacon.");
      return;
    }

    setSavingBeacon(true);
    try {
      const payload = {
        mapa_id: mapaId,
        nombre: beaconForm.nombre.trim(),
        identificador: `bcn-${Date.now()}`,
        x: pendingBeaconPoint.x,
        y: pendingBeaconPoint.y,
        estatus: beaconForm.estatus || "ACTIVO",
      };

      const response = await apiClient.post(
        "/api/admin/instituciones/beacon",
        payload,
      );

      const newBeacon = response?.data?.beacon;
      if (newBeacon) {
        setBeacons((prev) => [...prev, newBeacon]);
      } else if (selectedRecord) {
        await loadMapDetail(selectedRecord);
      }

      setPendingBeaconPoint(null);
      setBeaconForm(EMPTY_BEACON_FORM);
      setBeaconMode(false);
      alert("Beacon guardado correctamente.");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "No se pudo guardar el beacon.";

      alert(`Error al guardar beacon:
${msg}`);
    } finally {
      setSavingBeacon(false);
    }
  };

  const renderTreeNode = (record) => {
    const isSelected = selectedRecordId === record.id;

    return (
      <div key={record.id}>
        <button
          type="button"
          onClick={() => handleSelectRecord(record)}
          style={{
            width: "100%",
            textAlign: "left",
            background: isSelected
              ? "rgba(0, 179, 136, 0.18)"
              : "rgba(255,255,255,0.04)",
            color: "#fff",
            border: isSelected
              ? "1px solid rgba(0, 179, 136, 0.75)"
              : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "10px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              marginBottom: "4px",
            }}
          >
            {record.nombre}
          </div>
          <div
            style={{ fontSize: "0.8rem", opacity: 0.85, marginBottom: "4px" }}
          >
            Tipo: {record.tipo}
          </div>
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: "24px",
        width: "100%",
      }}
    >
      <div style={{ ...cardStyle, height: "fit-content" }}>
        <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#fff" }}>
          Estructura registrada
        </h2>

        <div
          style={{ maxHeight: "74vh", overflowY: "auto", paddingRight: "6px" }}
        >
          {loadingMaps ? (
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                padding: "16px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              Cargando mapas desde backend...
            </div>
          ) : topLevelRecords.length === 0 ? (
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                padding: "16px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              Aún no hay mapas registrados en backend.
            </div>
          ) : (
            topLevelRecords.map((record) => renderTreeNode(record))
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: "24px" }}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#fff" }}>
            Registrar nueva zona
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Nombre de la zona
              </label>
              <input
                name="nombre"
                value={formMap.nombre}
                onChange={(e) =>
                  setFormMap((prev) => ({ ...prev, nombre: e.target.value }))
                }
                style={mapInputStyle}
                placeholder="Ej. Edificio A, Piso 1, Plano general"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Descripción opcional
              </label>
              <textarea
                value={formMap.descripcion}
                onChange={(e) =>
                  setFormMap((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
                rows="3"
                style={{
                  ...mapInputStyle,
                  resize: "vertical",
                  minHeight: "92px",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <label
              style={{
                ...primaryActionStyle,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "220px",
                opacity: uploading || savingInstitution ? 0.75 : 1,
                cursor:
                  uploading || savingInstitution ? "not-allowed" : "pointer",
              }}
            >
              {uploading
                ? "Subiendo..."
                : savingInstitution
                  ? "Registrando..."
                  : "Subir imagen y guardar"}
              <input
                type="file"
                accept="image/*"
                onChange={handleCreateMapRecord}
                style={{ display: "none" }}
                disabled={uploading || savingInstitution}
              />
            </label>

            <button
              type="button"
              onClick={() => setFormMap(EMPTY_MAP_FORM)}
              style={secondaryActionStyle}
            >
              Limpiar formulario
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#fff" }}>
              Vista previa
            </h2>

            {selectedRecord && (
              <button
                type="button"
                onClick={() => setBeaconMode((v) => !v)}
                style={secondaryActionStyle}
              >
                {beaconMode ? "Cancelar beacon" : "Agregar beacon"}
              </button>
            )}
          </div>

          {!selectedRecord ? (
            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "16px",
                padding: "18px",
              }}
            >
              Selecciona una zona para ver su información.
            </div>
          ) : (
            <>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "18px",
                  padding: "18px",
                  marginBottom: "18px",
                }}
              >
                <p style={mapMetaText}>
                  <strong>Nombre:</strong> {selectedRecord.nombre}
                </p>
                <p style={mapMetaText}>
                  <strong>Tipo:</strong> {selectedRecord.tipo}
                </p>
                <p style={mapMetaText}>
                  <strong>Institución detectada:</strong> {institutionId}
                </p>
                <p style={mapMetaText}>
                  <strong>Mapa ID:</strong>{" "}
                  {getResolvedMapaId() || "No disponible"}
                </p>
                <p style={mapMetaText}>
                  <strong>Beacons cargados:</strong> {beacons.length}
                </p>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "18px",
                  padding: "18px",
                  minHeight: "460px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  marginBottom: "18px",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    ref={imageRef}
                    src={currentMapUrl || defaultMapImage}
                    alt={selectedRecord.nombre}
                    onClick={handleImageClickForBeacon}
                    style={{
                      maxWidth: "96%",
                      maxHeight: "72vh",
                      objectFit: "contain",
                      borderRadius: "12px",
                      cursor: beaconMode ? "crosshair" : "default",
                      display: "block",
                    }}
                  />

                  {beacons.map((beacon) => (
                    <span
                      key={
                        beacon.id ||
                        `${beacon.x}-${beacon.y}-${beacon.identificador}`
                      }
                      title={beacon.nombre || beacon.identificador}
                      style={{
                        position: "absolute",
                        left: `${Number(beacon.x) - 8}px`,
                        top: `${Number(beacon.y) - 8}px`,
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#20c997",
                        border: "3px solid #fff",
                        boxShadow: "0 0 0 2px rgba(0,0,0,0.15)",
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                  {pendingBeaconPoint && (
                    <span
                      style={{
                        position: "absolute",
                        left: `${pendingBeaconPoint.x - 9}px`,
                        top: `${pendingBeaconPoint.y - 9}px`,
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#ff5a5f",
                        border: "3px solid #fff",
                        boxShadow: "0 0 0 2px rgba(0,0,0,0.15)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
              </div>

              {beaconMode && (
                <div
                  style={{
                    ...cardStyle,
                    padding: "20px",
                    marginBottom: "18px",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#fff" }}>
                    Registrar salida / beacon
                  </h3>

                  <p style={mapMetaText}>
                    Punto seleccionado en X: {pendingBeaconPoint?.x ?? "-"}, Y:{" "}
                    {pendingBeaconPoint?.y ?? "-"}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        Nombre
                      </label>
                      <input
                        value={beaconForm.nombre}
                        onChange={(e) =>
                          setBeaconForm((prev) => ({
                            ...prev,
                            nombre: e.target.value,
                          }))
                        }
                        style={mapInputStyle}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      >
                        Estatus
                      </label>
                      <select
                        value={beaconForm.estatus}
                        onChange={(e) =>
                          setBeaconForm((prev) => ({
                            ...prev,
                            estatus: e.target.value,
                          }))
                        }
                        style={mapInputStyle}
                      >
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
                  >
                    <button
                      type="button"
                      onClick={handleSaveBeacon}
                      disabled={savingBeacon}
                      style={{
                        ...primaryActionStyle,
                        opacity: savingBeacon ? 0.75 : 1,
                      }}
                    >
                      {savingBeacon ? "Guardando beacon..." : "Guardar beacon"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPendingBeaconPoint(null);
                        setBeaconForm(EMPTY_BEACON_FORM);
                      }}
                      style={secondaryActionStyle}
                    >
                      Limpiar datos beacon
                    </button>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMapKey(selectedRecord.key || "");
                    setCurrentMapFileName("");
                    setCurrentMapLabel(
                      selectedRecord.nombre || "Mapa principal",
                    );
                  }}
                  style={primaryActionStyle}
                >
                  Usar como mapa principal
                </button>

                <button
                  type="button"
                  onClick={handleDeleteLocalRecord}
                  style={secondaryActionStyle}
                >
                  Gestión local deshabilitada
                </button>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "18px",
                  padding: "18px",
                }}
              >
                <h3 style={{ marginTop: 0, color: "#fff" }}>
                  Beacons / salidas del mapa
                </h3>

                {loadingMapDetail ? (
                  <p style={mapMetaText}>Cargando beacons...</p>
                ) : beacons.length === 0 ? (
                  <p style={mapMetaText}>
                    No hay beacons registrados para este mapa.
                  </p>
                ) : (
                  beacons.map((beacon) => (
                    <div
                      key={
                        beacon.id ||
                        `${beacon.x}-${beacon.y}-${beacon.identificador}`
                      }
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "14px",
                        padding: "14px",
                        marginBottom: "10px",
                      }}
                    >
                      <p style={mapMetaText}>
                        <strong>{beacon.nombre || "Sin nombre"}</strong>
                      </p>
                      <p style={mapMetaText}>
                        ID: {beacon.identificador || "Sin identificador"}
                      </p>
                      <p style={mapMetaText}>
                        Coordenadas: X {beacon.x} / Y {beacon.y}
                      </p>
                      <p style={mapMetaText}>
                        Estatus: {beacon.estatus || "ACTIVO"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UsuariosSection() {
  const [mode, setMode] = useState("list");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formUser, setFormUser] = useState(EMPTY_USER);

  const reloadUsers = async () => {
    try {
      const dataFromApi = await getAllUsers();
      setUsers(
        Array.isArray(dataFromApi)
          ? dataFromApi
          : dataFromApi?.usuarios || dataFromApi?.data || [],
      );
    } catch (error) {
      console.error("Error recargando usuarios:", error);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      await reloadUsers();
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.nombres || "").toLowerCase().includes(term) ||
      (u.correo || "").toLowerCase().includes(term) ||
      String(u.id || "").includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "add") {
        await registerUser({
          nombres: formUser.nombres,
          telefono: formUser.telefono || null,
          edad: formUser.edad === "" ? null : parseInt(formUser.edad, 10),
          correo: formUser.correo,
          pwd: formUser.pwd || "Guardian123*",
          activo: true,
        });
      } else if (mode === "edit") {
        const payload = {
          nombres: formUser.nombres,
          telefono: formUser.telefono || null,
          edad: formUser.edad === "" ? null : parseInt(formUser.edad, 10),
          correo: formUser.correo,
          activo: formUser.activo,
        };
        if (formUser.pwd?.trim()) payload.pwd = formUser.pwd.trim();
        await updateUser(formUser.id, payload);
      }
      await reloadUsers();
      setMode("list");
      setFormUser(EMPTY_USER);
    } catch (error) {
      alert(`No se pudo guardar el usuario:\n${error?.message || error}`);
    }
  };

  const handleDelete = async (id) => {
    const cleanId = String(id).split(":")[0].trim();
    if (!cleanId) return;
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar al usuario con ID: ${cleanId}?`,
      )
    )
      return;
    try {
      await deleteUser(cleanId);
      await reloadUsers();
    } catch (error) {
      alert(`No se pudo eliminar: ${error?.message || error}`);
    }
  };

  if (mode === "add" || mode === "edit") {
    const isEdit = mode === "edit";
    return (
      <div className="users-section">
        <h2 className="users-title">
          {isEdit ? "Editar Usuario" : "Añadir Usuarios"}
        </h2>
        <form className="user-form" onSubmit={handleSubmit}>
          <div className="user-form-block">
            <h3 className="user-form-subtitle">Datos del Usuario:</h3>
            <div className="user-form-grid">
              <UserField
                label="Nombre Completo"
                name="nombres"
                value={formUser.nombres}
                onChange={(e) =>
                  setFormUser((p) => ({ ...p, nombres: e.target.value }))
                }
              />
              <UserField
                label="Correo Electrónico"
                name="correo"
                type="email"
                value={formUser.correo}
                onChange={(e) =>
                  setFormUser((p) => ({ ...p, correo: e.target.value }))
                }
              />
              <UserField
                label="Teléfono"
                name="telefono"
                value={formUser.telefono}
                onChange={(e) =>
                  setFormUser((p) => ({ ...p, telefono: e.target.value }))
                }
              />
              <UserField
                label="Edad"
                name="edad"
                type="number"
                value={formUser.edad}
                onChange={(e) =>
                  setFormUser((p) => ({ ...p, edad: e.target.value }))
                }
              />
              <UserField
                label="Contraseña (genérica)"
                name="pwd"
                type="password"
                value={formUser.pwd}
                onChange={(e) =>
                  setFormUser((p) => ({ ...p, pwd: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="user-form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setMode("list");
                setFormUser(EMPTY_USER);
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="users-section">
        <h2 className="users-title">Usuarios Registrados</h2>
        <p className="users-empty">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="users-section">
      <div className="users-header">
        <h2 className="users-title">Usuarios Registrados</h2>
        <div className="users-search-wrapper">
          <span className="users-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar usuario por nombre o registro..."
            className="users-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Edad</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.nombres || "Sin nombre"}</td>
                <td>{user.correo}</td>
                <td>{user.edad || "N/A"}</td>
                <td>
                  <span
                    className={`user-status-badge ${user.activo ? "user-status-badge--activo" : "user-status-badge--inactivo"}`}
                  >
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>{user.telefono || "Sin Tel."}</td>
                <td>
                  <button
                    type="button"
                    className="user-action-btn user-action-edit"
                    onClick={() => {
                      setFormUser({ ...EMPTY_USER, ...user, pwd: "" });
                      setMode("edit");
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="user-action-btn user-action-delete"
                    onClick={() => handleDelete(user.id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="users-empty">
                  No se encontraron usuarios con ese criterio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="users-footer">
        <button
          type="button"
          className="users-add-button"
          onClick={() => {
            setFormUser(EMPTY_USER);
            setMode("add");
          }}
        >
          + Añadir Usuario
        </button>
      </div>
    </div>
  );
}

function UserField({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="user-field">
      <label className="user-field-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="user-field-input"
        type={type}
        value={value ?? ""}
        onChange={onChange}
      />
    </div>
  );
}

function SimMetricCard({ title, value, subtitle = "" }) {
  return (
    <div style={{ ...cardStyle, padding: "18px" }}>
      <p
        style={{
          margin: 0,
          color: "rgba(255,255,255,0.72)",
          fontSize: "0.9rem",
        }}
      >
        {title}
      </p>
      <h3 style={{ margin: "8px 0 6px", color: "#fff", fontSize: "1.6rem" }}>
        {value}
      </h3>
      {subtitle ? (
        <p
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.85rem",
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function SimulacrosSection({ currentUser }) {
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillState, setDrillState] = useState(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState("");
  const [historial, setHistorial] = useState([]);
  const [beaconCatalog, setBeaconCatalog] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("recent");

  const institutionId = resolveInstitutionIdFromUser(currentUser);

  const loadFirebaseSimulacros = async () => {
    setFirebaseLoading(true);
    setFirebaseError("");

    try {
      const [historialData, beaconCatalogData, currentState] =
        await Promise.all([
          getSimulacrosHistorialByInstitution(institutionId),
          getBeaconCatalogByInstitution(institutionId),
          getCurrentSimulacroStateByInstitution(institutionId),
        ]);

      setHistorial(historialData);
      setBeaconCatalog(beaconCatalogData);
      setAnalytics(buildSimulacroAnalytics(historialData, beaconCatalogData));
      setDrillState(
        typeof currentState?.activo === "boolean" ? currentState.activo : null,
      );
    } catch (error) {
      console.error("Error cargando simulacros desde Firebase:", error);
      setFirebaseError(
        error?.message || "No se pudo cargar el historial de simulacros.",
      );
      setHistorial([]);
      setBeaconCatalog({});
      setAnalytics(buildSimulacroAnalytics([], {}));
      setDrillState(null);
    } finally {
      setFirebaseLoading(false);
    }
  };

  useEffect(() => {
    loadFirebaseSimulacros();
  }, [institutionId]);

  const sendDrillState = async (state) => {
    setDrillLoading(true);

    try {
      const response = await fetch(DRILL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institucion_id: institutionId,
          institution_id: institutionId,
          state,
        }),
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (typeof data === "string"
              ? data
              : "No se pudo actualizar el simulacro."),
        );
      }

      await syncSimulacroImages(institutionId, state);

      if (state === true) {
        await startSimulacroTimer(institutionId);
      } else {
        await finishSimulacroTimer(institutionId, {
          manual: true,
          riesgo: 0,
          beacon: "SIMULACRO_GENERAL",
        });
      }

      setDrillState(state);
      await loadFirebaseSimulacros();

      alert(
        state
          ? "Simulacro activado correctamente."
          : "Simulacro desactivado y tiempo guardado correctamente.",
      );
    } catch (error) {
      console.error("Error cambiando simulacro:", error);
      alert(
        `No se pudo cambiar el estado del simulacro:
${error?.message || error}`,
      );
    } finally {
      setDrillLoading(false);
    }
  };

  const filteredHistorialBase = historial.filter((item) => {
    const term = search.toLowerCase();
    const identificador =
      beaconCatalog[item.beacon]?.identificador?.toLowerCase() || "";

    return (
      String(item.beacon || "")
        .toLowerCase()
        .includes(term) ||
      identificador.includes(term) ||
      String(item.fechaInicio || "")
        .toLowerCase()
        .includes(term) ||
      String(item.fechaFin || "")
        .toLowerCase()
        .includes(term) ||
      String(item.duracionTexto || "")
        .toLowerCase()
        .includes(term) ||
      String(item.riesgo || "")
        .toLowerCase()
        .includes(term) ||
      (item.manual ? "manual" : "automatico").includes(term) ||
      (item.activo ? "activo" : "inactivo").includes(term)
    );
  });

  const filteredHistorial = [...filteredHistorialBase].sort((a, b) => {
    if (sortMode === "recent") {
      return Number(b.timestamp || 0) - Number(a.timestamp || 0);
    }
    if (sortMode === "oldest") {
      return Number(a.timestamp || 0) - Number(b.timestamp || 0);
    }
    if (sortMode === "best_time") {
      return (
        Number(a.duracionSegundos || 999999) -
        Number(b.duracionSegundos || 999999)
      );
    }
    if (sortMode === "worst_time") {
      return Number(b.duracionSegundos || 0) - Number(a.duracionSegundos || 0);
    }
    if (sortMode === "highest_risk") {
      return Number(b.riesgo || 0) - Number(a.riesgo || 0);
    }
    if (sortMode === "lowest_risk") {
      return Number(a.riesgo || 0) - Number(b.riesgo || 0);
    }
    return 0;
  });

  return (
    <div className="sim-section">
      <div style={{ ...cardStyle, marginBottom: "24px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#fff" }}>
          Control de simulacro
        </h2>

        <p style={mapMetaText}>
          <strong>Institución:</strong> {institutionId}
        </p>

        <p style={mapMetaText}>
          <strong>Estado actual:</strong>{" "}
          {drillState === null
            ? "Sin estado detectado"
            : drillState
              ? "ACTIVO"
              : "INACTIVO"}
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => sendDrillState(true)}
            disabled={drillLoading || drillState === true}
            style={{
              ...primaryActionStyle,
              opacity: drillLoading || drillState === true ? 0.75 : 1,
            }}
          >
            {drillLoading ? "Procesando..." : "Activar simulacro"}
          </button>

          <button
            type="button"
            onClick={() => sendDrillState(false)}
            disabled={
              drillLoading || drillState === false || drillState === null
            }
            style={{
              ...secondaryActionStyle,
              opacity:
                drillLoading || drillState === false || drillState === null
                  ? 0.75
                  : 1,
            }}
          >
            Desactivar simulacro
          </button>

          <button
            type="button"
            onClick={loadFirebaseSimulacros}
            disabled={firebaseLoading}
            style={secondaryActionStyle}
          >
            {firebaseLoading ? "Actualizando..." : "Actualizar historial"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <SimMetricCard
          title="Total de eventos"
          value={analytics?.totalEventos ?? 0}
        />
        <SimMetricCard
          title="Eventos manuales"
          value={analytics?.totalManuales ?? 0}
        />
        <SimMetricCard
          title="Eventos automáticos"
          value={analytics?.totalAutomaticos ?? 0}
        />
        <SimMetricCard
          title="Riesgo promedio"
          value={analytics?.riesgoPromedio ?? "0.00"}
        />
        <SimMetricCard
          title="Riesgo máximo"
          value={analytics?.riesgoMaximo ?? 0}
        />
        <SimMetricCard
          title="Último evento"
          value={
            analytics?.ultimoEvento?.fechaFin ||
            analytics?.ultimoEvento?.fechaInicio ||
            "Sin datos"
          }
        />
        <SimMetricCard
          title="Mejor tiempo"
          value={analytics?.mejorTiempo?.duracionTexto || "Sin datos"}
          subtitle={
            analytics?.mejorTiempo
              ? beaconCatalog[analytics.mejorTiempo.beacon]?.identificador ||
                analytics.mejorTiempo.beacon
              : ""
          }
        />
        <SimMetricCard
          title="Peor tiempo"
          value={analytics?.peorTiempo?.duracionTexto || "Sin datos"}
          subtitle={
            analytics?.peorTiempo
              ? beaconCatalog[analytics.peorTiempo.beacon]?.identificador ||
                analytics.peorTiempo.beacon
              : ""
          }
        />
      </div>

      <h2 className="section-title">Historial de simulacros</h2>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div
          className="sim-search-wrapper"
          style={{ flex: 1, minWidth: "280px" }}
        >
          <span className="sim-search-icon">🔍</span>
          <input
            type="text"
            className="sim-search-input"
            placeholder="Buscar por beacon, zona, fecha, duración o riesgo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          style={{
            ...mapInputStyle,
            width: "260px",
            background: "rgba(255,255,255,0.96)",
          }}
        >
          <option value="recent">Más reciente</option>
          <option value="oldest">Más antiguo</option>
          <option value="best_time">Mejor tiempo</option>
          <option value="worst_time">Peor tiempo</option>
          <option value="highest_risk">Mayor riesgo</option>
          <option value="lowest_risk">Menor riesgo</option>
        </select>
      </div>

      {firebaseError && (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "rgba(255, 77, 79, 0.14)",
            color: "#fff",
          }}
        >
          {firebaseError}
        </div>
      )}

      <div className="sim-table-wrapper">
        <table className="sim-table">
          <thead>
            <tr>
              <th>Beacon</th>
              <th>Zona</th>
              <th>Riesgo</th>
              <th>Manual</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            {firebaseLoading ? (
              <tr>
                <td colSpan="7" className="sim-empty">
                  Cargando historial desde Firebase...
                </td>
              </tr>
            ) : filteredHistorial.length > 0 ? (
              filteredHistorial.map((item) => (
                <tr key={item.id}>
                  <td>{item.beacon}</td>
                  <td>
                    {beaconCatalog[item.beacon]?.identificador || "Sin zona"}
                  </td>
                  <td>{item.riesgo}</td>
                  <td>{item.manual ? "Sí" : "No"}</td>
                  <td>{item.fechaInicio || "-"}</td>
                  <td>{item.fechaFin || "-"}</td>
                  <td>{item.duracionTexto || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="sim-empty">
                  No hay eventos en el historial para esta institución.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IncidentesSection() {
  const [mode, setMode] = useState("list");
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [formInc, setFormInc] = useState(EMPTY_INCIDENCIA);

  const loadIncidencias = async () => {
    try {
      setLoading(true);
      const data = await getAllIncidenciasAdmin();
      setIncidencias(
        Array.isArray(data) ? data : data?.incidencias || data?.data || [],
      );
    } catch (error) {
      alert(
        `No se pudieron cargar las incidencias.\n${error?.message || error}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidencias();
  }, []);

  const filtered = incidencias.filter((i) => {
    const term = search.toLowerCase();
    return (
      (i.incidente || "").toLowerCase().includes(term) ||
      (i.estatus || "").toLowerCase().includes(term) ||
      (i.piso || "").toLowerCase().includes(term) ||
      (i.fecha || "").toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateIncidenciaAdmin(formInc.id, {
        piso: formInc.piso.trim(),
        incidente: formInc.incidente.trim(),
        cantidad_heridos: Number(formInc.cantidad_heridos) || 0,
        fecha: formInc.fecha,
        hora: formInc.hora,
        estatus: formInc.estatus || "Pendiente",
      });
      await loadIncidencias();
      setMode("list");
      setSelected(null);
      setFormInc(EMPTY_INCIDENCIA);
    } catch (error) {
      alert(`No se pudo guardar:\n${error?.message || error}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la incidencia ID: ${id}?`))
      return;
    try {
      await deleteIncidenciaAdmin(id);
      await loadIncidencias();
    } catch (error) {
      alert(`No se pudo eliminar:\n${error?.message || error}`);
    }
  };

  const renderStatusBadge = (estatus) => {
    let className = "inc-status-badge ";
    if (estatus === "Pendiente") className += "inc-status-badge--pendiente";
    else if (estatus === "En progreso")
      className += "inc-status-badge--progreso";
    else if (estatus === "Atendido") className += "inc-status-badge--atendido";
    return <span className={className}>{estatus || "Pendiente"}</span>;
  };

  if (loading)
    return (
      <div className="inc-section">
        <h2 className="section-title">Incidentes</h2>
        <p className="inc-empty">Cargando incidencias...</p>
      </div>
    );

  if (mode === "detail" && selected) {
    return (
      <div className="inc-section">
        <h2 className="section-title">Detalles del incidente</h2>
        <div className="inc-detail-card">
          <div className="inc-detail-row">
            <span className="inc-detail-label">Incidente:</span>
            <span>{selected.incidente}</span>
          </div>
          <div className="inc-detail-row">
            <span className="inc-detail-label">Piso:</span>
            <span>{selected.piso}</span>
          </div>
          <div className="inc-detail-row">
            <span className="inc-detail-label">Fecha:</span>
            <span>{selected.fecha}</span>
          </div>
          <div className="inc-detail-row">
            <span className="inc-detail-label">Hora:</span>
            <span>{selected.hora}</span>
          </div>
          <div className="inc-detail-row">
            <span className="inc-detail-label">Heridos:</span>
            <span>
              {selected.cantidad_heridos ??
                selected.cantidadHeridos ??
                selected.heridos ??
                0}
            </span>
          </div>
          <div className="inc-detail-row">
            <span className="inc-detail-label">Estatus:</span>
            <span>{renderStatusBadge(selected.estatus)}</span>
          </div>
          <div className="inc-detail-actions">
            <button
              type="button"
              className="sim-secondary-button"
              onClick={() => {
                setMode("list");
                setSelected(null);
              }}
            >
              Volver a la lista
            </button>
            <button
              type="button"
              className="sim-primary-button"
              onClick={() => {
                setFormInc({
                  id: selected.id ?? "",
                  piso: selected.piso ?? "",
                  incidente: selected.incidente ?? "",
                  cantidad_heridos:
                    selected.cantidad_heridos ??
                    selected.cantidadHeridos ??
                    selected.heridos ??
                    0,
                  fecha: selected.fecha ?? "",
                  hora: selected.hora ?? "",
                  estatus: selected.estatus ?? "Pendiente",
                });
                setMode("edit");
              }}
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="inc-section">
        <h2 className="section-title">Editar Incidencia</h2>
        <form className="inc-status-form" onSubmit={handleSubmit}>
          <div className="inc-status-field">
            <label>Incidente</label>
            <input
              value={formInc.incidente}
              onChange={(e) =>
                setFormInc((p) => ({ ...p, incidente: e.target.value }))
              }
              required
            />
          </div>
          <div className="inc-status-field">
            <label>Piso</label>
            <input
              value={formInc.piso}
              onChange={(e) =>
                setFormInc((p) => ({ ...p, piso: e.target.value }))
              }
              required
            />
          </div>
          <div className="inc-status-field">
            <label>Cantidad de heridos</label>
            <input
              type="number"
              min="0"
              value={formInc.cantidad_heridos}
              onChange={(e) =>
                setFormInc((p) => ({ ...p, cantidad_heridos: e.target.value }))
              }
            />
          </div>
          <div className="inc-status-field">
            <label>Fecha</label>
            <input
              type="date"
              value={formInc.fecha}
              onChange={(e) =>
                setFormInc((p) => ({ ...p, fecha: e.target.value }))
              }
              required
            />
          </div>
          <div className="inc-status-field">
            <label>Hora</label>
            <input
              type="time"
              value={formInc.hora}
              onChange={(e) =>
                setFormInc((p) => ({ ...p, hora: e.target.value }))
              }
              required
            />
          </div>
          <div className="inc-status-field">
            <label>Estatus</label>
            <select
              value={formInc.estatus}
              onChange={(e) =>
                setFormInc((p) => ({ ...p, estatus: e.target.value }))
              }
            >
              {ESTATUS_INCIDENCIAS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="inc-status-actions">
            <button
              type="button"
              className="sim-secondary-button"
              onClick={() => {
                setMode("list");
                setSelected(null);
                setFormInc(EMPTY_INCIDENCIA);
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="sim-primary-button">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="inc-section">
      <h2 className="section-title">Incidentes</h2>
      <div className="inc-search-row">
        <div className="inc-search-wrapper">
          <span className="inc-search-icon">🔍</span>
          <input
            type="text"
            className="inc-search-input"
            placeholder="Buscar por incidente, piso, estatus o fecha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="inc-table-wrapper">
        <table className="inc-table">
          <thead>
            <tr>
              <th>Incidente</th>
              <th>Piso</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Heridos</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inc) => (
              <tr key={inc.id}>
                <td>{inc.incidente}</td>
                <td>{inc.piso}</td>
                <td>{inc.fecha}</td>
                <td>{inc.hora}</td>
                <td>
                  {inc.cantidad_heridos ??
                    inc.cantidadHeridos ??
                    inc.heridos ??
                    0}
                </td>
                <td>{renderStatusBadge(inc.estatus)}</td>
                <td>
                  <div className="inc-actions">
                    <button
                      type="button"
                      className="inc-icon-button"
                      onClick={() => {
                        setSelected(inc);
                        setMode("detail");
                      }}
                    >
                      👁️
                    </button>
                    <button
                      type="button"
                      className="inc-icon-button"
                      onClick={() => {
                        setSelected(inc);
                        setFormInc({
                          id: inc.id ?? "",
                          piso: inc.piso ?? "",
                          incidente: inc.incidente ?? "",
                          cantidad_heridos:
                            inc.cantidad_heridos ??
                            inc.cantidadHeridos ??
                            inc.heridos ??
                            0,
                          fecha: inc.fecha ?? "",
                          hora: inc.hora ?? "",
                          estatus: inc.estatus ?? "Pendiente",
                        });
                        setMode("edit");
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="inc-icon-button"
                      onClick={() => handleDelete(inc.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="inc-empty">
                  No se encontraron incidencias con ese criterio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AjustesSection({ theme, setTheme }) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });
  const [photoName, setPhotoName] = useState("");

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordData.nueva || !passwordData.confirmar) {
      alert("Llena la nueva contraseña y la confirmación.");
      return;
    }
    if (passwordData.nueva !== passwordData.confirmar) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    alert("Contraseña actualizada (simulación).");
    setPasswordData({ actual: "", nueva: "", confirmar: "" });
    setShowPassword(false);
  };

  return (
    <div className="settings-section">
      <h2 className="section-title">Ajustes</h2>
      <div className="settings-layout">
        <div className="settings-options">
          <button
            type="button"
            className="settings-button"
            onClick={() => setShowPassword((v) => !v)}
          >
            Cambiar contraseña
          </button>
          {showPassword && (
            <form className="settings-form" onSubmit={handlePasswordSubmit}>
              <label className="settings-field-label">
                Contraseña actual
                <input
                  type="password"
                  className="settings-input"
                  value={passwordData.actual}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, actual: e.target.value }))
                  }
                />
              </label>
              <label className="settings-field-label">
                Nueva contraseña
                <input
                  type="password"
                  className="settings-input"
                  value={passwordData.nueva}
                  onChange={(e) =>
                    setPasswordData((p) => ({ ...p, nueva: e.target.value }))
                  }
                />
              </label>
              <label className="settings-field-label">
                Confirmar contraseña
                <input
                  type="password"
                  className="settings-input"
                  value={passwordData.confirmar}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      confirmar: e.target.value,
                    }))
                  }
                />
              </label>
              <div className="settings-actions">
                <button
                  type="button"
                  className="settings-button secondary"
                  onClick={() => setShowPassword(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="settings-button primary">
                  Guardar
                </button>
              </div>
            </form>
          )}

          <button
            type="button"
            className="settings-button"
            onClick={() =>
              document.getElementById("settings-photo-input")?.click()
            }
          >
            Seleccionar foto de perfil
          </button>
          <input
            id="settings-photo-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPhotoName(file.name);
            }}
          />
          {photoName && (
            <p className="settings-info">Foto seleccionada: {photoName}</p>
          )}

          <button
            type="button"
            className="settings-button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            Cambiar a modo {theme === "dark" ? "claro" : "oscuro"}
          </button>
          <p className="settings-info">
            Modo actual:{" "}
            <strong>{theme === "light" ? "claro" : "oscuro"}</strong>
          </p>
        </div>

        <div className="settings-illustration">
          <div className="gear gear-large">
            <div className="gear-center" />
          </div>
          <div className="gear gear-small">
            <div className="gear-center" />
          </div>
        </div>
      </div>
    </div>
  );
}
