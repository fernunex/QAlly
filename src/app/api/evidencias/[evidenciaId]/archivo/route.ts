import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesion } from "@/lib/session";
import { comprobarError, errorPublico, ErrorOperacion } from "@/lib/resultados";
import { uuid } from "@/features/projects/validation";

const ESTADOS_HTTP: Record<string, number> = {
  SIN_SESION: 401,
  PROHIBIDO: 403,
  NO_DISPONIBLE: 404,
  DATOS_INVALIDOS: 422,
  FALLO_PERSISTENCIA: 500,
};
const privado = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const evidenciaRow = z.object({
  tipo: z.literal("PDF"),
  archivo: z.object({
    ruta_objeto: z.string(),
    nombre_archivo: z.string(),
    estado: z.literal("Disponible"),
  }),
});

/** Nombre seguro para Content-Disposition: ASCII de respaldo y UTF-8 codificado (RFC 6266). */
function disposicion(nombre: string) {
  const limpio = nombre.replace(/[\x00-\x1f\x7f"\\/]/g, "_");
  const ascii = limpio.normalize("NFKD").replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(limpio)}`;
}

/**
 * Contratos v1 §5: descarga de un PDF de evidencia con la identidad del usuario.
 * Sin ruta Storage del cliente; RLS de evidencia, archivo y Storage vuelven a autorizar.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/evidencias/[evidenciaId]/archivo">,
) {
  try {
    const { evidenciaId } = await ctx.params;
    if (!uuid.safeParse(evidenciaId).success)
      throw new ErrorOperacion("NO_DISPONIBLE");
    const { supabase } = await obtenerSesion();
    const r = await supabase
      .from("evidencia")
      .select(
        "tipo,archivo:archivo_evidencia(ruta_objeto,nombre_archivo,estado)",
      )
      .eq("id", evidenciaId)
      .maybeSingle();
    comprobarError(r.error);
    const ev = evidenciaRow.safeParse(r.data);
    if (!ev.success) throw new ErrorOperacion("NO_DISPONIBLE");
    const { data, error } = await supabase.storage
      .from("evidencias")
      .download(ev.data.archivo.ruta_objeto);
    if (error || !data) throw new ErrorOperacion("NO_DISPONIBLE");
    return new NextResponse(data.stream(), {
      headers: {
        ...privado,
        "Content-Type": "application/pdf",
        "Content-Length": String(data.size),
        "Content-Disposition": disposicion(ev.data.archivo.nombre_archivo),
      },
    });
  } catch (error) {
    const e = errorPublico(error);
    return NextResponse.json(
      { ok: false, error: { codigo: e.codigo, mensaje: e.mensaje } },
      { status: ESTADOS_HTTP[e.codigo] ?? 409, headers: privado },
    );
  }
}
