import type { NextRequest } from "next/server";
import { z } from "zod";
import { obtenerSesion } from "@/lib/session";
import { errorPublico, ErrorOperacion } from "@/lib/resultados";
import {
  CABECERAS_PRIVADAS,
  disposicionAdjunto,
  ESTADO_HTTP,
  leerCuerpoLimitado,
  origenPermitido,
} from "@/lib/http";
import { consultarProyecto } from "@/features/projects/server/queries";
import {
  CapturaInvalida,
  comprobarVigencia,
  verificarCaptura,
} from "@/features/reports/server/captura";
import { LIMITE_PDF_REPORTE, renderizarReportePdf } from "@/features/reports/server/pdf";
import { modeloReporte, nombreArchivoReporte } from "@/features/reports/lib/modelo";

// Runtime Node.js predeterminado (con cacheComponents no se declara `runtime`): usa node:crypto
// y @react-pdf/renderer, que Next mantiene como paquete externo de servidor.

/** 2 MiB de cuerpo JSON (contratos v1 §6). */
const LIMITE_CUERPO = 2 * 1024 * 1024;
const cuerpoSchema = z.strictObject({ capturaToken: z.string().min(1) });

const MENSAJES_TAMANO = {
  cuerpo: "La solicitud de exportación supera el límite de 2 MiB.",
  pdf: "El PDF generado supera el límite de 3 MiB. No se recortó contenido; informa al equipo para revisar el diseño.",
};

/**
 * POST /api/reportes/pdf — exporta la captura vigente (CU-06 SF-01). Nunca acepta un resumen
 * libre del navegador ni vuelve a consultar la calidad: el contenido sale de la captura
 * cifrada, tras verificar de nuevo sesión, rol QA, integridad, usuario, participación y
 * vigencia. Respuesta privada como adjunto. El token no se registra.
 */
export async function POST(request: NextRequest) {
  let fase: keyof typeof MENSAJES_TAMANO = "cuerpo";
  try {
    if (!origenPermitido(request)) throw new ErrorOperacion("PROHIBIDO");
    const { usuario } = await obtenerSesion();
    if (usuario.rol !== "QA") throw new ErrorOperacion("PROHIBIDO");
    if (
      request.headers.get("content-type")?.split(";")[0]?.trim() !==
      "application/json"
    )
      throw new CapturaInvalida();
    const bytes = await leerCuerpoLimitado(request.body, LIMITE_CUERPO);
    let json: unknown;
    try {
      json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch {
      throw new CapturaInvalida();
    }
    const cuerpo = cuerpoSchema.safeParse(json);
    if (!cuerpo.success) throw new CapturaInvalida();

    // Integridad y usuario; después participación vigente (QA de proyecto abierto o
    // cerrado, con la sesión y RLS) y, por último, la vigencia de 15 minutos.
    const captura = verificarCaptura(cuerpo.data.capturaToken, { usuarioId: usuario.id });
    if (!(await consultarProyecto(captura.proyectoId)))
      throw new ErrorOperacion("NO_DISPONIBLE");
    comprobarVigencia(captura);

    fase = "pdf";
    // Mismo modelo que la vista; el origen solo vuelve absolutos los enlaces a evidencias PDF.
    const origen = new URL(request.url).origin;
    const pdf = await renderizarReportePdf(modeloReporte(captura.resumen, captura.emitidaEn, origen));
    if (pdf.byteLength > LIMITE_PDF_REPORTE) throw new ErrorOperacion("TAMANO_EXCEDIDO");
    return new Response(new Uint8Array(pdf), {
      headers: {
        ...CABECERAS_PRIVADAS,
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": disposicionAdjunto(
          nombreArchivoReporte(captura.resumen.proyecto.nombre, captura.emitidaEn),
          "reporte-calidad.pdf",
        ),
      },
    });
  } catch (error) {
    const e = errorPublico(error);
    if (e.codigo === "TAMANO_EXCEDIDO") e.mensaje = MENSAJES_TAMANO[fase];
    return Response.json(
      { ok: false, error: e },
      { status: ESTADO_HTTP[e.codigo], headers: CABECERAS_PRIVADAS },
    );
  }
}
