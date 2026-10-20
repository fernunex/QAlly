"use server";

import { obtenerSesion } from "@/lib/session";
import {
  errorPublico,
  ErrorOperacion,
  type ErrorPublico,
  type Resultado,
} from "@/lib/resultados";
import { uuid } from "@/features/projects/validation";
import { consultarResumen } from "@/features/health/server/queries";
import { emitirCaptura } from "./server/captura";
import type { ReporteGenerado } from "./types";

const MENSAJE_TAMANO =
  "El reporte supera el límite técnico de 1 MiB de la captura. No se recortan métricas ni actividades; informa al equipo para revisar el diseño.";

function errorReporte(error: unknown): ErrorPublico {
  const e = errorPublico(error);
  return e.codigo === "TAMANO_EXCEDIDO" ? { ...e, mensaje: MENSAJE_TAMANO } : e;
}

/**
 * `generarReporte` (contratos v1 §6, CU-06 pasos 3–5): exige QA participante, también con
 * el proyecto cerrado (no modifica datos). Reutiliza `consultarResumen` de CU-05 —la RPC
 * vuelve a exigir participación— y emite la captura cifrada de 15 minutos que usará la
 * exportación. Cada llamada es una regeneración: nueva lectura, nueva fecha y nuevo token.
 */
export async function generarReporte(
  proyectoId: unknown,
): Promise<Resultado<ReporteGenerado>> {
  try {
    const { usuario } = await obtenerSesion();
    if (usuario.rol !== "QA") throw new ErrorOperacion("PROHIBIDO");
    const id = uuid.safeParse(proyectoId);
    if (!id.success) throw new ErrorOperacion("NO_DISPONIBLE");
    const resumen = await consultarResumen(id.data);
    const captura = emitirCaptura({
      usuarioId: usuario.id,
      proyectoId: id.data,
      resumen,
    });
    return {
      ok: true,
      datos: {
        resumen,
        capturaToken: captura.token,
        emitidaEn: captura.emitidaEn,
        venceEn: captura.venceEn,
      },
    };
  } catch (error) {
    return { ok: false, error: errorReporte(error) };
  }
}
