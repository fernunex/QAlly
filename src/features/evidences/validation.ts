import { z } from "zod";
import { uuid, version } from "@/features/projects/validation";

/** ADR-002: PDF hasta 3 MiB y enlace HTTP/HTTPS absoluto de hasta 2048 caracteres. */
export const LIMITE_PDF = 3145728;
export const LIMITE_ENLACE = 2048;
export const LIMITE_RESULTADO = 20000;

export const MSJ_FALTA_RESULTADO = "Falta el resultado de la actividad.";
export const MSJ_FALTA_EVIDENCIA =
  "Falta la evidencia: adjunta un PDF o agrega un enlace.";
export const MSJ_ENLACE =
  "El enlace no es válido: debe ser una URL http:// o https:// de hasta 2048 caracteres.";
export const MSJ_PDF = "El archivo no es un PDF válido o supera 3 MiB.";

/** Misma regla que la restricción de BD: esquema http/https, host y sin espacios. */
export function enlaceValido(valor: string): boolean {
  if (valor.length === 0 || valor.length > LIMITE_ENLACE) return false;
  if (!/^https?:\/\/[^\s/?#]+\S*$/i.test(valor)) return false;
  try {
    const u = new URL(valor);
    return (u.protocol === "http:" || u.protocol === "https:") && !!u.hostname;
  } catch {
    return false;
  }
}

/** Nombre informativo: sin rutas ni caracteres de control y con sufijo .pdf. */
export function nombrePdfValido(nombre: string): boolean {
  return (
    nombre.length > 0 &&
    nombre.length <= 255 &&
    !/[\x00-\x1f/\\]/.test(nombre) &&
    nombre.toLowerCase().endsWith(".pdf")
  );
}

/** Validación básica de formato: cabecera %PDF- y marcador final %%EOF. No certifica ausencia de contenido activo. */
export function contenidoPdfValido(bytes: Uint8Array): boolean {
  if (bytes.length < 1 || bytes.length > LIMITE_PDF) return false;
  const inicio = new TextDecoder("latin1").decode(bytes.subarray(0, 5));
  const fin = new TextDecoder("latin1").decode(bytes.subarray(-1024));
  return inicio === "%PDF-" && /%%EOF\s*$/.test(fin);
}

const resultado = z
  .string()
  .refine(
    (v) => [...v].length <= LIMITE_RESULTADO,
    `Máximo ${LIMITE_RESULTADO} caracteres.`,
  )
  .transform((v) => v.trim() || null);

export const actividadVersionSchema = z.strictObject({
  actividadId: uuid,
  versionEsperada: version,
});
export const guardarResultadoSchema = z.strictObject({
  entregaId: uuid,
  resultado,
  versionEsperada: version,
});
export const agregarEnlaceSchema = z.strictObject({
  entregaId: uuid,
  url: z.string().trim().refine(enlaceValido, MSJ_ENLACE),
  versionEsperada: version,
});
export const quitarEvidenciaSchema = z.strictObject({
  evidenciaId: uuid,
  versionEsperada: version,
});
export const enviarEntregaSchema = z.strictObject({
  entregaId: uuid,
  versionEsperada: version,
});
