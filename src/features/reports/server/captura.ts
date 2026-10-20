import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
import { ErrorOperacion } from "@/lib/resultados";
import type { ResumenProyecto } from "@/features/health/types";

/*
 * Captura autocontenida del reporte (contratos v1 §6, ADR-002).
 *
 * - Payload JSON `{version: 1, usuarioId, proyectoId, emitidaEn, venceEn, resumen}`, vigente
 *   15 minutos y de hasta 1 MiB en UTF-8: si se supera, TAMANO_EXCEDIDO sin truncar datos.
 * - AES-256-GCM de `node:crypto` con clave de entorno de 32 bytes (REPORT_SNAPSHOT_KEY_BASE64),
 *   nonce aleatorio de 12 bytes por captura, tag de 16 bytes y el formato como datos
 *   autenticados. Token `v1.iv.ciphertext.tag` con segmentos base64url.
 * - Sin tabla ni memoria compartida: no existe historial de reportes. Rotar la clave invalida
 *   las capturas abiertas.
 *
 * Nunca registrar el token, la clave ni el resumen.
 */

export const VERSION_CAPTURA = 1 as const;
export const VIGENCIA_CAPTURA_MS = 15 * 60 * 1000;
/** 1 MiB del JSON de la captura en UTF-8. */
export const LIMITE_CAPTURA = 1024 * 1024;

const PREFIJO = "v1";
const AAD = Buffer.from("qally:reporte-calidad:captura:v1", "utf8");
const BYTES_IV = 12;
const BYTES_TAG = 16;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

export type CapturaReporte = {
  version: typeof VERSION_CAPTURA;
  usuarioId: string;
  proyectoId: string;
  /** ISO */
  emitidaEn: string;
  /** ISO */
  venceEn: string;
  resumen: ResumenProyecto;
};

/** Token alterado, mal formado o ajeno: mismo rechazo para no revelar la causa. */
export class CapturaInvalida extends ErrorOperacion {
  constructor() {
    super("DATOS_INVALIDOS", {
      capturaToken: "La captura del reporte no es válida. Genera el reporte de nuevo.",
    });
  }
}

function clave(): Buffer {
  const valor = process.env.REPORT_SNAPSHOT_KEY_BASE64;
  const bytes = valor ? Buffer.from(valor, "base64") : Buffer.alloc(0);
  // Configuración ausente o inválida: fallo técnico genérico, sin detallar el secreto.
  if (bytes.length !== 32) throw new Error("FALLO_PERSISTENCIA");
  return bytes;
}

function decodificar(segmento: string | undefined): Buffer {
  if (!segmento || !BASE64URL.test(segmento)) throw new CapturaInvalida();
  return Buffer.from(segmento, "base64url");
}

const iso = z.string().refine((v) => !Number.isNaN(Date.parse(v)));
const payloadSchema = z.strictObject({
  version: z.literal(VERSION_CAPTURA),
  usuarioId: z.uuid(),
  proyectoId: z.uuid(),
  emitidaEn: iso,
  venceEn: iso,
  // El contenido está autenticado por GCM; se comprueba la forma mínima y la pertenencia.
  resumen: z.looseObject({ proyecto: z.looseObject({ id: z.uuid() }) }),
});

/** Cifra el resumen en una captura nueva ligada a QA y proyecto. */
export function emitirCaptura(
  entrada: { usuarioId: string; proyectoId: string; resumen: ResumenProyecto },
  ahora: Date = new Date(),
): { token: string; emitidaEn: string; venceEn: string } {
  if (entrada.resumen.proyecto.id !== entrada.proyectoId)
    throw new Error("FALLO_PERSISTENCIA");
  const emitidaEn = ahora.toISOString();
  const venceEn = new Date(ahora.getTime() + VIGENCIA_CAPTURA_MS).toISOString();
  const payload: CapturaReporte = {
    version: VERSION_CAPTURA,
    usuarioId: entrada.usuarioId,
    proyectoId: entrada.proyectoId,
    emitidaEn,
    venceEn,
    resumen: entrada.resumen,
  };
  const json = Buffer.from(JSON.stringify(payload), "utf8");
  if (json.byteLength > LIMITE_CAPTURA) throw new ErrorOperacion("TAMANO_EXCEDIDO");
  const iv = randomBytes(BYTES_IV);
  const cifrador = createCipheriv("aes-256-gcm", clave(), iv, { authTagLength: BYTES_TAG });
  cifrador.setAAD(AAD);
  const cifrado = Buffer.concat([cifrador.update(json), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  const token = [PREFIJO, iv, cifrado, tag]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
  return { token, emitidaEn, venceEn };
}

/**
 * Verifica formato, integridad (GCM), forma del payload y pertenencia a usuario/proyecto,
 * sin evaluar la vigencia. Cualquier falla es el mismo DATOS_INVALIDOS. La participación en
 * el proyecto y el rol QA se comprueban fuera, con la sesión.
 */
export function verificarCaptura(
  token: string,
  esperado: { usuarioId: string; proyectoId?: string },
): CapturaReporte {
  const partes = token.split(".");
  if (partes.length !== 4 || partes[0] !== PREFIJO) throw new CapturaInvalida();
  const iv = decodificar(partes[1]);
  const cifrado = decodificar(partes[2]);
  const tag = decodificar(partes[3]);
  if (iv.length !== BYTES_IV || tag.length !== BYTES_TAG || cifrado.length > LIMITE_CAPTURA)
    throw new CapturaInvalida();
  const llave = clave();
  let json: string;
  try {
    const descifrador = createDecipheriv("aes-256-gcm", llave, iv, {
      authTagLength: BYTES_TAG,
    });
    descifrador.setAAD(AAD);
    descifrador.setAuthTag(tag);
    json = Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString("utf8");
  } catch {
    throw new CapturaInvalida();
  }
  let datos: unknown;
  try {
    datos = JSON.parse(json);
  } catch {
    throw new CapturaInvalida();
  }
  const r = payloadSchema.safeParse(datos);
  if (!r.success) throw new CapturaInvalida();
  const p = r.data;
  if (
    p.usuarioId !== esperado.usuarioId ||
    (esperado.proyectoId !== undefined && p.proyectoId !== esperado.proyectoId) ||
    p.resumen.proyecto.id !== p.proyectoId
  )
    throw new CapturaInvalida();
  const emitida = Date.parse(p.emitidaEn);
  const vence = Date.parse(p.venceEn);
  if (vence <= emitida || vence - emitida > VIGENCIA_CAPTURA_MS) throw new CapturaInvalida();
  return p as unknown as CapturaReporte;
}

/** Captura íntegra y propia pero vencida: CAPTURA_EXPIRADA (410), se regenera con la vista. */
export function comprobarVigencia(captura: CapturaReporte, ahora: Date = new Date()) {
  if (ahora.getTime() >= Date.parse(captura.venceEn))
    throw new ErrorOperacion("CAPTURA_EXPIRADA");
}

/** Verificación completa: integridad → usuario/proyecto → vigencia. */
export function abrirCaptura(
  token: string,
  esperado: { usuarioId: string; proyectoId?: string },
  ahora: Date = new Date(),
): CapturaReporte {
  const captura = verificarCaptura(token, esperado);
  comprobarVigencia(captura, ahora);
  return captura;
}
