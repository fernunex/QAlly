import type { NextRequest } from "next/server";
import { errorPublico } from "@/lib/resultados";
import {
  disposicionAdjunto,
  leerPdf,
} from "@/features/evidences/server/archivos";

const privado = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

/** GET /api/evidencias/{evidenciaId}/archivo — PDF privado como adjunto, también en proyecto cerrado. */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/evidencias/[evidenciaId]/archivo">,
) {
  try {
    const { evidenciaId } = await ctx.params;
    const { nombre, contenido } = await leerPdf(evidenciaId);
    return new Response(contenido, {
      headers: {
        ...privado,
        "Content-Type": "application/pdf",
        "Content-Disposition": disposicionAdjunto(nombre),
      },
    });
  } catch (error) {
    const e = errorPublico(error);
    // Sin sesión, inexistente o ajeno: no se distingue el recurso.
    const status =
      e.codigo === "SIN_SESION" ? 401 : e.codigo === "FALLO_PERSISTENCIA" ? 500 : 404;
    return new Response(e.mensaje, {
      status,
      headers: { ...privado, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
