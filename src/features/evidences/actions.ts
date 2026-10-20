"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/session";
import {
  comprobarError,
  errorPublico,
  ErrorOperacion,
  type ErrorPublico,
  type Resultado,
} from "@/lib/resultados";
import { validar } from "@/features/projects/validation";
import type { MiActividad, Nombres } from "@/features/activities/utils";
import {
  actividadVersionSchema,
  agregarEnlaceSchema,
  enviarEntregaSchema,
  guardarResultadoSchema,
  MSJ_FALTA_EVIDENCIA,
  MSJ_FALTA_RESULTADO,
  quitarEvidenciaSchema,
} from "./validation";
import {
  actividadDeEntrega,
  consultarMiActividad,
  entregaDeEvidencia,
} from "./server/queries";

export type ActividadActualizada = { actividad: MiActividad; nombres: Nombres };

/** Solo el miembro asignado inicia y entrega; QA revisa mediante CU-03. */
async function exigirMiembro() {
  const sesion = await obtenerSesion();
  if (sesion.usuario.rol !== "Miembro") throw new ErrorOperacion("PROHIBIDO");
  return sesion;
}

/** Versión enviada como cadena validada: el generador tipa bigint como number. */
const v = (version: string) => version as unknown as number;

async function recargar(
  actividadId: string | null,
): Promise<Resultado<ActividadActualizada>> {
  const { actividad, nombres } = actividadId
    ? await consultarMiActividad(actividadId)
    : { actividad: null, nombres: {} };
  if (!actividad) throw new ErrorOperacion("NO_DISPONIBLE");
  revalidatePath("/mis-actividades");
  revalidatePath(`/proyectos/${actividad.proyectoId}`, "layout");
  return { ok: true, datos: { actividad, nombres } };
}

/** FE-01: el mismo mensaje para actividad inexistente, ajena o no asignada. */
function fallo(error: unknown): { ok: false; error: ErrorPublico } {
  const e = errorPublico(error);
  if (e.codigo === "NO_DISPONIBLE")
    e.mensaje = "La actividad no está disponible o no está asignada a ti.";
  return { ok: false, error: e };
}

/** SF-01: Pendiente → En progreso y prepara el primer intento para registrar el resultado. */
export async function iniciarActividadAction(
  entrada: unknown,
): Promise<Resultado<ActividadActualizada>> {
  try {
    const { supabase } = await exigirMiembro();
    const p = validar(actividadVersionSchema, entrada);
    const r = await supabase.rpc("iniciar_actividad", {
      p_actividad_id: p.actividadId,
      p_version_esperada: v(p.versionEsperada),
    });
    comprobarError(r.error);
    const { version } = r.data as { version: string };
    // Si la preparación falla, la actividad queda En progreso y el intento se prepara después.
    await supabase.rpc("preparar_entrega", {
      p_actividad_id: p.actividadId,
      p_version_esperada: v(version),
    });
    return await recargar(p.actividadId);
  } catch (error) {
    return fallo(error);
  }
}

/** Prepara el intento en curso; tras una devolución copia resultado y evidencias previas (SF-02). */
export async function prepararEntregaAction(
  entrada: unknown,
): Promise<Resultado<ActividadActualizada>> {
  try {
    const { supabase } = await exigirMiembro();
    const p = validar(actividadVersionSchema, entrada);
    const r = await supabase.rpc("preparar_entrega", {
      p_actividad_id: p.actividadId,
      p_version_esperada: v(p.versionEsperada),
    });
    comprobarError(r.error);
    return await recargar(p.actividadId);
  } catch (error) {
    return fallo(error);
  }
}

export async function guardarResultadoAction(
  entrada: unknown,
): Promise<Resultado<ActividadActualizada>> {
  try {
    const { supabase } = await exigirMiembro();
    const p = validar(guardarResultadoSchema, entrada);
    const r = await supabase.rpc("guardar_resultado", {
      p_entrega_id: p.entregaId,
      p_resultado: p.resultado ?? "",
      p_version_esperada: v(p.versionEsperada),
    });
    comprobarError(r.error);
    return await recargar(await actividadDeEntrega(p.entregaId));
  } catch (error) {
    return fallo(error);
  }
}

/** Enlace HTTP/HTTPS validado sin descargar el destino. */
export async function agregarEnlaceAction(
  entrada: unknown,
): Promise<Resultado<ActividadActualizada>> {
  try {
    const { supabase } = await exigirMiembro();
    const p = validar(agregarEnlaceSchema, entrada);
    const r = await supabase.rpc("agregar_enlace", {
      p_entrega_id: p.entregaId,
      p_url: p.url,
      p_version_esperada: v(p.versionEsperada),
    });
    comprobarError(r.error);
    return await recargar(await actividadDeEntrega(p.entregaId));
  } catch (error) {
    return fallo(error);
  }
}

/** Retira la referencia del intento en preparación; no borra un PDF usado por otro intento. */
export async function quitarEvidenciaAction(
  entrada: unknown,
): Promise<Resultado<ActividadActualizada>> {
  try {
    const { supabase } = await exigirMiembro();
    const p = validar(quitarEvidenciaSchema, entrada);
    const entregaId = await entregaDeEvidencia(p.evidenciaId);
    if (!entregaId) throw new ErrorOperacion("NO_DISPONIBLE");
    const r = await supabase.rpc("quitar_evidencia", {
      p_evidencia_id: p.evidenciaId,
      p_version_esperada: v(p.versionEsperada),
    });
    comprobarError(r.error);
    return await recargar(await actividadDeEntrega(entregaId));
  } catch (error) {
    return fallo(error);
  }
}

/** Pasos 7–9: valida resultado y evidencia y cambia a En revisión en una sola transacción. */
export async function enviarEntregaAction(
  entrada: unknown,
): Promise<Resultado<ActividadActualizada>> {
  try {
    const { supabase } = await exigirMiembro();
    const p = validar(enviarEntregaSchema, entrada);
    const entrega = await supabase
      .from("entrega")
      .select("actividad_id,resultado,evidencia(count)")
      .eq("id", p.entregaId)
      .maybeSingle();
    comprobarError(entrega.error);
    if (!entrega.data) throw new ErrorOperacion("NO_DISPONIBLE");
    // FE-02: indicar qué elemento obligatorio falta. La RPC vuelve a validarlo en el commit.
    const campos: Record<string, string> = {};
    if (!entrega.data.resultado?.trim()) campos.resultado = MSJ_FALTA_RESULTADO;
    if (!entrega.data.evidencia[0]?.count) campos.evidencia = MSJ_FALTA_EVIDENCIA;
    if (Object.keys(campos).length)
      throw new ErrorOperacion("DATOS_INVALIDOS", campos);
    const r = await supabase.rpc("enviar_entrega", {
      p_entrega_id: p.entregaId,
      p_version_esperada: v(p.versionEsperada),
    });
    comprobarError(r.error);
    return await recargar(entrega.data.actividad_id);
  } catch (error) {
    return fallo(error);
  }
}
