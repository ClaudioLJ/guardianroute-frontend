import { ref, get, set, push, remove } from "firebase/database";
import { database } from "../firebase";

function parseTimestamp(value) {
  if (!value) return 0;

  const n = Number(value);
  if (!Number.isNaN(n)) return n;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value) {
  const ts = parseTimestamp(value);
  if (!ts) return "Sin fecha";

  return new Date(ts).toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function objectToArray(raw) {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).map(([id, value]) => ({
    id,
    ...(value || {}),
  }));
}

function formatDuration(seconds) {
  const safe = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export async function startSimulacroTimer(institutionId) {
  const now = Date.now();

  const payload = {
    activo: true,
    inicioTimestamp: now,
    inicioFormateado: formatDateTime(now),
    institucionId: institutionId,
  };

  await set(ref(database, `simulacro_actual/${institutionId}`), payload);

  return payload;
}

export async function finishSimulacroTimer(institutionId, extraData = {}) {
  const currentRef = ref(database, `simulacro_actual/${institutionId}`);
  const snapshot = await get(currentRef);

  if (!snapshot.exists()) {
    throw new Error("No hay un simulacro en curso para cerrar.");
  }

  const current = snapshot.val() || {};
  const inicioTimestamp = Number(current.inicioTimestamp || 0);
  const finTimestamp = Date.now();

  const duracionMs = Math.max(0, finTimestamp - inicioTimestamp);
  const duracionSegundos = Math.floor(duracionMs / 1000);

  const payload = {
    activo: false,
    manual: normalizeBoolean(extraData.manual ?? true),
    riesgo: normalizeNumber(extraData.riesgo ?? 0),
    beacon: extraData.beacon || "SIMULACRO_GENERAL",
    inicioTimestamp,
    finTimestamp,
    duracionMs,
    duracionSegundos,
    duracionTexto: formatDuration(duracionSegundos),
    fechaInicio: formatDateTime(inicioTimestamp),
    fechaFin: formatDateTime(finTimestamp),
    timestamp: finTimestamp,
    institucionId: institutionId,
  };

  await push(ref(database, `simulacros_historial/${institutionId}`), payload);
  await remove(currentRef);

  return payload;
}

export async function getSimulacrosHistorialByInstitution(institutionId) {
  const rootPath = `simulacros_historial/${institutionId}`;
  const snapshot = await get(ref(database, rootPath));

  if (!snapshot.exists()) {
    return [];
  }

  const raw = snapshot.val();

  return objectToArray(raw)
    .map((item) => ({
      id: item.id,
      beacon: item.beacon || "Sin beacon",
      activo: normalizeBoolean(item.activo),
      manual: normalizeBoolean(item.manual),
      riesgo: normalizeNumber(item.riesgo),
      timestamp:
        item.timestamp || item.finTimestamp || item.inicioTimestamp || null,
      inicioTimestamp: item.inicioTimestamp || null,
      finTimestamp: item.finTimestamp || null,
      fechaInicio: item.fechaInicio || formatDateTime(item.inicioTimestamp),
      fechaFin: item.fechaFin || formatDateTime(item.finTimestamp),
      duracionMs: normalizeNumber(item.duracionMs),
      duracionSegundos: normalizeNumber(item.duracionSegundos),
      duracionTexto:
        item.duracionTexto ||
        formatDuration(normalizeNumber(item.duracionSegundos)),
      fechaFormateada:
        item.fechaFormateada ||
        formatDateTime(
          item.timestamp || item.finTimestamp || item.inicioTimestamp,
        ),
    }))
    .sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp));
}

export async function getCurrentSimulacroStateByInstitution(institutionId) {
  const rootPath = `simulacro_actual/${institutionId}`;
  const snapshot = await get(ref(database, rootPath));

  if (!snapshot.exists()) {
    return null;
  }

  const raw = snapshot.val() || {};

  return {
    activo: normalizeBoolean(raw.activo),
    inicioTimestamp: raw.inicioTimestamp || null,
    inicioFormateado:
      raw.inicioFormateado || formatDateTime(raw.inicioTimestamp),
    institucionId: raw.institucionId || institutionId,
  };
}

export async function getBeaconCatalogByInstitution(institutionId) {
  const rootPath = `${institutionId}`;
  const snapshot = await get(ref(database, rootPath));

  if (!snapshot.exists()) {
    return {};
  }

  const raw = snapshot.val() || {};
  const result = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, "identificador")
    ) {
      result[key] = {
        beaconId: key,
        identificador: value.identificador || key,
        x: value.X ?? null,
        y: value.Y ?? null,
        riesgoBase: normalizeNumber(value.riesgo),
      };
    }
  });

  return result;
}

export function buildSimulacroAnalytics(historial, beaconCatalog = {}) {
  const totalEventos = historial.length;
  const totalManuales = historial.filter((e) => e.manual).length;
  const totalAutomaticos = historial.filter((e) => !e.manual).length;
  const totalActivos = historial.filter((e) => e.activo).length;

  const riesgoPromedio =
    totalEventos > 0
      ? (
          historial.reduce(
            (acc, item) => acc + normalizeNumber(item.riesgo),
            0,
          ) / totalEventos
        ).toFixed(2)
      : "0.00";

  const riesgoMaximo =
    totalEventos > 0
      ? Math.max(...historial.map((e) => normalizeNumber(e.riesgo)))
      : 0;

  const ultimoEvento = totalEventos > 0 ? historial[0] : null;

  const eventosConDuracion = historial.filter(
    (e) => normalizeNumber(e.duracionSegundos) > 0,
  );

  const mejorTiempo =
    eventosConDuracion.length > 0
      ? [...eventosConDuracion].sort(
          (a, b) => a.duracionSegundos - b.duracionSegundos,
        )[0]
      : null;

  const peorTiempo =
    eventosConDuracion.length > 0
      ? [...eventosConDuracion].sort(
          (a, b) => b.duracionSegundos - a.duracionSegundos,
        )[0]
      : null;

  const conteoPorBeacon = {};
  historial.forEach((item) => {
    const key = item.beacon || "Sin beacon";
    conteoPorBeacon[key] = (conteoPorBeacon[key] || 0) + 1;
  });

  const beaconMasFrecuenteEntry = Object.entries(conteoPorBeacon).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const beaconMasFrecuente = beaconMasFrecuenteEntry
    ? {
        beacon: beaconMasFrecuenteEntry[0],
        total: beaconMasFrecuenteEntry[1],
        identificador:
          beaconCatalog[beaconMasFrecuenteEntry[0]]?.identificador ||
          beaconMasFrecuenteEntry[0],
      }
    : null;

  return {
    totalEventos,
    totalManuales,
    totalAutomaticos,
    totalActivos,
    riesgoPromedio,
    riesgoMaximo,
    ultimoEvento,
    beaconMasFrecuente,
    mejorTiempo,
    peorTiempo,
  };
}
