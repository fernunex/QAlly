import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { obtenerSesion } from "@/lib/session";
import { crearClienteAdministrativo } from "@/lib/supabase/admin";
import { comprobarError, ErrorOperacion } from "@/lib/resultados";
import { leerCuerpoLimitado as leerCuerpo } from "@/lib/http";
import { uuid } from "@/features/projects/validation";
import { contenidoPdfValido, LIMITE_PDF, nombrePdfValido } from "../validation";

const BUCKET = "evidencias";
/** Rechazos transaccionales conocidos: la asociación falló y el objeto no tiene referencias. */
const RECHAZOS_CONOCIDOS = ["P0001", "23514", "23503"];

/** Lee el cuerpo del PDF contando bytes reales, sin confiar en Content-Length (3 MiB). */
export function leerCuerpoLimitado(
  cuerpo: ReadableStream<Uint8Array> | null,
): Promise<Uint8Array> {
  return leerCuerpo(cuerpo, LIMITE_PDF);
}

/** Compensación inmediata de una transferencia terminada cuya asociación fue rechazada. */
async function compensar(archivoId: string) {
  const admin = crearClienteAdministrativo();
  const marcados = await admin.rpc("marcar_limpieza", {
    p_limite: 1,
    p_archivo_compensacion_id: archivoId,
  });
  if (marcados.error) return;
  for (const f of z
    .array(z.object({ id: uuid, rutaObjeto: z.string() }))
    .parse(marcados.data)) {
    const borrado = await admin.storage.from(BUCKET).remove([f.rutaObjeto]);
    if (borrado.error) return; // Queda Eliminando para la limpieza diaria.
    await admin.rpc("confirmar_eliminacion", { p_archivo_id: f.id });
  }
}

/**
 * Protocolo ADR-002: verificar identidad y autorización con la sesión del usuario,
 * reservar, transferir y confirmar. Solo la confirmación asocia la evidencia.
 */
export async function subirPdf(datos: {
  entregaId: string;
  versionEsperada: string;
  nombre: string;
  bytes: Uint8Array;
}): Promise<{ actividadId: string }> {
  const { supabase, usuario } = await obtenerSesion();
  if (usuario.rol !== "Miembro") throw new ErrorOperacion("PROHIBIDO");
  if (!nombrePdfValido(datos.nombre) || !contenidoPdfValido(datos.bytes))
    throw new ErrorOperacion("DATOS_INVALIDOS", {
      evidencia: "El archivo no es un PDF válido.",
    });

  const entrega = await supabase
    .from("entrega")
    .select("actividad_id,enviada_en,autor_id,actividad:actividad_sqa!entrega_actividad_id_fkey(responsable_id,estado)")
    .eq("id", datos.entregaId)
    .maybeSingle();
  comprobarError(entrega.error);
  if (!entrega.data) throw new ErrorOperacion("NO_DISPONIBLE");
  const actividad = [entrega.data.actividad].flat()[0];
  if (
    actividad?.responsable_id !== usuario.id ||
    entrega.data.autor_id !== usuario.id
  )
    throw new ErrorOperacion("PROHIBIDO");
  if (actividad.estado !== "En progreso" || entrega.data.enviada_en)
    throw new ErrorOperacion("CONFLICTO");

  const admin = crearClienteAdministrativo();
  const reserva = await admin.rpc("reservar_archivo", {
    p_actor_verificado_id: usuario.id,
    p_entrega_id: datos.entregaId,
    p_version_esperada: datos.versionEsperada as unknown as number,
    p_metadata_validada: {
      nombreArchivo: datos.nombre,
      mimeType: "application/pdf",
      tamanoBytes: datos.bytes.byteLength,
      sha256: createHash("sha256").update(datos.bytes).digest("hex"),
    },
  });
  comprobarError(reserva.error);
  const { id: archivoId, rutaObjeto } = z
    .object({ id: uuid, rutaObjeto: z.string() })
    .parse(reserva.data);

  const subida = await admin.storage
    .from(BUCKET)
    .upload(rutaObjeto, datos.bytes, {
      contentType: "application/pdf",
      upsert: false,
      cacheControl: "0",
    });
  if (subida.error) {
    // Un resultado ambiguo (sin respuesta del servicio) no borra: la reserva expira y se limpia.
    const status = Number((subida.error as { statusCode?: string }).statusCode);
    if (status >= 400 && status < 500) await compensar(archivoId).catch(() => {});
    throw new ErrorOperacion(status === 413 ? "TAMANO_EXCEDIDO" : "FALLO_PERSISTENCIA");
  }

  const confirmacion = await admin.rpc("confirmar_archivo", {
    p_actor_verificado_id: usuario.id,
    p_archivo_id: archivoId,
    p_version_esperada: datos.versionEsperada as unknown as number,
  });
  if (confirmacion.error) {
    if (RECHAZOS_CONOCIDOS.includes(confirmacion.error.code ?? ""))
      await compensar(archivoId).catch(() => {});
    comprobarError(confirmacion.error);
  }
  return { actividadId: entrega.data.actividad_id };
}

/** Lectura privada: autoriza con la sesión del usuario y RLS de Storage en cada solicitud. */
export async function leerPdf(evidenciaId: string) {
  const { supabase } = await obtenerSesion();
  if (!uuid.safeParse(evidenciaId).success)
    throw new ErrorOperacion("NO_DISPONIBLE");
  const r = await supabase
    .from("evidencia")
    .select("tipo,archivo:archivo_evidencia!evidencia_archivo_id_fkey(ruta_objeto,nombre_archivo,estado)")
    .eq("id", evidenciaId)
    .maybeSingle();
  comprobarError(r.error);
  const archivo = [r.data?.archivo].flat()[0];
  if (r.data?.tipo !== "PDF" || !archivo || archivo.estado !== "Disponible")
    throw new ErrorOperacion("NO_DISPONIBLE");
  const descarga = await supabase.storage
    .from(BUCKET)
    .download(archivo.ruta_objeto);
  if (descarga.error || !descarga.data) throw new ErrorOperacion("NO_DISPONIBLE");
  return { nombre: archivo.nombre_archivo, contenido: descarga.data };
}

export { disposicionAdjunto } from "@/lib/http";
