import "server-only";
import { ErrorOperacion, type CodigoError } from "@/lib/resultados";

/*
 * Utilidades compartidas de Route Handlers (contratos v1 §1, §5 y §6): estados HTTP del
 * sobre de error, cabeceras privadas, control de origen, lectura de cuerpo con límite real
 * y nombre de adjunto saneado.
 */

export const ESTADO_HTTP: Record<CodigoError, number> = {
  SIN_SESION: 401,
  PROHIBIDO: 403,
  NO_DISPONIBLE: 404,
  DATOS_INVALIDOS: 422,
  CONFLICTO: 409,
  PROYECTO_CERRADO: 409,
  TAMANO_EXCEDIDO: 413,
  CAPTURA_EXPIRADA: 410,
  FALLO_PERSISTENCIA: 500,
};

export const CABECERAS_PRIVADAS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

/** Mutación web: el origen debe estar presente y coincidir con el host que atiende la petición. */
export function origenPermitido(request: Request) {
  const origen = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origen || !host) return false;
  try {
    return new URL(origen).host === host;
  } catch {
    return false;
  }
}

/** Lee el cuerpo contando bytes reales, sin confiar en Content-Length. */
export async function leerCuerpoLimitado(
  cuerpo: ReadableStream<Uint8Array> | null,
  limite: number,
): Promise<Uint8Array> {
  if (!cuerpo) throw new ErrorOperacion("DATOS_INVALIDOS");
  const reader = cuerpo.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      await reader.cancel().catch(() => {});
      throw new ErrorOperacion("TAMANO_EXCEDIDO");
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let i = 0;
  for (const p of partes) {
    bytes.set(p, i);
    i += p.byteLength;
  }
  return bytes;
}

/** Nombre saneado para Content-Disposition, con alternativa ASCII. */
export function disposicionAdjunto(
  nombre: string,
  alternativo = "evidencia.pdf",
): string {
  const limpio = nombre.replace(/[\x00-\x1f\x7f"\\/;]/g, "_") || alternativo;
  const ascii = limpio.normalize("NFKD").replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(limpio)}`;
}
