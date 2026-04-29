import apiClient from "./apiClient";

const DELETE_MAP_IMAGE_ENDPOINT =
  "https://8u1kbopju1.execute-api.us-east-1.amazonaws.com/Prod/delImage";

export async function createInstitucionAdmin(payload) {
  const response = await apiClient.post("/api/admin/instituciones", payload);
  return response.data;
}

export async function deleteInstitucionMapByImageKey(imageKey) {
  const cleanKey = String(imageKey || "").trim();

  if (!cleanKey) {
    throw new Error("imageKey es requerido para eliminar el mapa.");
  }

  const encodedKey = encodeURIComponent(cleanKey);
  const response = await apiClient.delete(
    `/api/admin/instituciones/imagen/${encodedKey}`,
  );

  return response.data;
}

export async function deleteMapImageFromS3(imageKey) {
  const cleanKey = String(imageKey || "").trim();

  if (!cleanKey) {
    throw new Error("imageKey es requerido para eliminar la imagen en S3.");
  }

  const url = `${DELETE_MAP_IMAGE_ENDPOINT}?key=${imageKey}`;
  console.log(url);
  const response = await fetch(url, {
    method: "DELETE",
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
        "No se pudo eliminar la imagen del S3.",
    );
  }

  return data;
}

export async function deleteMapCompletely(imageKey) {
  alert(imageKey);
  const dbResult = await deleteInstitucionMapByImageKey(imageKey);
  const s3Result = await deleteMapImageFromS3(imageKey);

  return {
    ok: true,
    dbResult,
    s3Result,
  };
}
