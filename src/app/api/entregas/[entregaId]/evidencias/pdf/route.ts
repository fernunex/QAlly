import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { errorPublico, ErrorOperacion } from "@/lib/resultados";
import {
  CABECERAS_PRIVADAS as privado,
  ESTADO_HTTP as HTTP,
  origenPermitido,
} from "@/lib/http";
import { uuid, version } from "@/features/projects/validation";
import { consultarMiActividad } from "@/features/evidences/server/queries";
import {
  leerCuerpoLimitado,
  subirPdf,
} from "@/features/evidences/server/archivos";

/** POST /api/entregas/{entregaId}/evidencias/pdf — un único PDF binario por petición (contratos-v1 §5). */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/entregas/[entregaId]/evidencias/pdf">,
) {
  try {
    if (!origenPermitido(request)) throw new ErrorOperacion("PROHIBIDO");
    const { entregaId } = await ctx.params;
    const versionEsperada = request.headers.get("x-version-actividad") ?? "";
    let nombre = "";
    try {
      nombre = decodeURIComponent(request.headers.get("x-nombre-archivo") ?? "");
    } catch {
      /* Nombre mal codificado: se rechaza abajo. */
    }
    if (
      !uuid.safeParse(entregaId).success ||
      !version.safeParse(versionEsperada).success ||
      request.headers.get("content-type")?.split(";")[0]?.trim() !==
        "application/pdf"
    )
      throw new ErrorOperacion("DATOS_INVALIDOS", {
        evidencia: "El archivo no es un PDF válido.",
      });
    const bytes = await leerCuerpoLimitado(request.body);
    const { actividadId } = await subirPdf({
      entregaId,
      versionEsperada,
      nombre,
      bytes,
    });
    const { actividad, nombres } = await consultarMiActividad(actividadId);
    if (!actividad) throw new ErrorOperacion("NO_DISPONIBLE");
    revalidatePath("/mis-actividades");
    revalidatePath(`/proyectos/${actividad.proyectoId}`, "layout");
    return Response.json(
      { ok: true, datos: { actividad, nombres } },
      { headers: privado },
    );
  } catch (error) {
    const e = errorPublico(error);
    return Response.json(
      { ok: false, error: e },
      { status: HTTP[e.codigo], headers: privado },
    );
  }
}
