"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obtenerSesion } from "@/lib/session";
import {
  comprobarError,
  errorPublico,
  ErrorOperacion,
  type ErrorPublico,
  type Resultado,
} from "@/lib/resultados";
import {
  exigirProyecto,
  listarCatalogos,
} from "@/features/projects/server/queries";
import { uuid, validar } from "@/features/projects/validation";
import {
  consultarActividad,
  listarActividades,
  type ActividadDetalle,
  type ColumnaActividades,
} from "./server/queries";
import {
  agregarActividadSchema,
  aprobarEntregaSchema,
  asignarResponsableSchema,
  devolverEntregaSchema,
} from "./validation";

const MENSAJE_NO_DISPONIBLE =
  "Esta actividad no está disponible. Vuelve al listado de actividades.";

async function exigirQA() {
  const sesion = await obtenerSesion();
  if (sesion.usuario.rol !== "QA") throw new ErrorOperacion("PROHIBIDO");
  return sesion;
}
function refrescar(proyectoId: string) {
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${proyectoId}`, "layout");
}
function errorActividad(error: unknown): ErrorPublico {
  const e = errorPublico(error);
  return e.codigo === "NO_DISPONIBLE"
    ? { ...e, mensaje: MENSAJE_NO_DISPONIBLE }
    : e;
}
/** Proyecto de una actividad visible por RLS; inexistente o ajena se tratan igual. */
async function proyectoDeActividad(actividadId: string) {
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("actividad_sqa")
    .select("proyecto_id")
    .eq("id", actividadId)
    .maybeSingle();
  comprobarError(r.error);
  if (!r.data) throw new ErrorOperacion("NO_DISPONIBLE");
  return r.data.proyecto_id;
}
async function actividadDeEntrega(entregaId: string) {
  const { supabase } = await obtenerSesion();
  const r = await supabase
    .from("entrega")
    .select("actividad_id")
    .eq("id", entregaId)
    .maybeSingle();
  comprobarError(r.error);
  if (!r.data) throw new ErrorOperacion("NO_DISPONIBLE");
  return r.data.actividad_id;
}
const actividadRPC = z.object({ id: uuid });

export async function listarActividadesAction(
  entrada: unknown,
): Promise<Resultado<ColumnaActividades>> {
  try {
    return { ok: true, datos: await listarActividades(entrada) };
  } catch (error) {
    return { ok: false, error: errorPublico(error) };
  }
}

export async function consultarActividadAction(
  entrada: unknown,
): Promise<Resultado<ActividadDetalle>> {
  try {
    return { ok: true, datos: await consultarActividad(entrada) };
  } catch (error) {
    return { ok: false, error: errorActividad(error) };
  }
}

export async function agregarActividadAction(
  entrada: unknown,
): Promise<Resultado<ActividadDetalle>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(agregarActividadSchema, entrada);
    await exigirProyecto(p.proyectoId, true);
    const catalogos = await listarCatalogos();
    if (!catalogos.actividades.some((t) => t.id === p.tipoId))
      throw new ErrorOperacion("DATOS_INVALIDOS", {
        tipoId: "Elige un tipo de actividad vigente del catálogo.",
      });
    const r = await supabase.rpc("agregar_actividad", {
      p_proyecto_id: p.proyectoId,
      p_tipo_id: p.tipoId,
      p_descripcion: p.descripcion,
    });
    comprobarError(r.error);
    const { id } = actividadRPC.parse(r.data);
    refrescar(p.proyectoId);
    return { ok: true, datos: await consultarActividad({ actividadId: id }) };
  } catch (error) {
    return { ok: false, error: errorPublico(error) };
  }
}

export async function asignarResponsableAction(
  entrada: unknown,
): Promise<Resultado<ActividadDetalle>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(asignarResponsableSchema, entrada);
    const proyectoId = await proyectoDeActividad(p.actividadId);
    const proyecto = await exigirProyecto(proyectoId, true);
    if (
      !proyecto.participantes.some(
        (m) => m.usuarioId === p.responsableId && m.rol === "Miembro",
      )
    )
      throw new ErrorOperacion("DATOS_INVALIDOS", {
        responsableId: "Elige un miembro del equipo de este proyecto.",
      });
    const r = await supabase.rpc("asignar_responsable", {
      p_actividad_id: p.actividadId,
      p_responsable_id: p.responsableId,
      // El generador usa number para bigint. En el transporte se envía la cadena validada, sin convertirla.
      p_version_esperada: p.versionEsperada as unknown as number,
    });
    comprobarError(r.error);
    refrescar(proyectoId);
    return {
      ok: true,
      datos: await consultarActividad({ actividadId: p.actividadId }),
    };
  } catch (error) {
    return { ok: false, error: errorActividad(error) };
  }
}

async function revisar(
  decision: "Aprobar" | "Devolver",
  p: { entregaId: string; versionEsperada: string; observaciones: string | null },
): Promise<ActividadDetalle> {
  const { supabase } = await exigirQA();
  const actividadId = await actividadDeEntrega(p.entregaId);
  const proyectoId = await proyectoDeActividad(actividadId);
  await exigirProyecto(proyectoId, true);
  const r = await supabase.rpc("revisar_entrega", {
    p_entrega_id: p.entregaId,
    p_decision: decision,
    p_version_esperada: p.versionEsperada as unknown as number,
    p_observaciones: p.observaciones ?? undefined,
  });
  if (r.error?.message === "DATOS_INVALIDOS" && decision === "Aprobar")
    // FE-03: el intento no tiene resultado o evidencia válidos.
    throw new ErrorOperacion("DATOS_INVALIDOS", {
      entrega: "No se puede aprobar: falta el resultado o la evidencia del intento.",
    });
  comprobarError(r.error);
  refrescar(proyectoId);
  return consultarActividad({ actividadId });
}

export async function aprobarEntregaAction(
  entrada: unknown,
): Promise<Resultado<ActividadDetalle>> {
  try {
    await exigirQA();
    const p = validar(aprobarEntregaSchema, entrada);
    return { ok: true, datos: await revisar("Aprobar", p) };
  } catch (error) {
    return { ok: false, error: errorActividad(error) };
  }
}

export async function devolverEntregaAction(
  entrada: unknown,
): Promise<Resultado<ActividadDetalle>> {
  try {
    await exigirQA();
    const p = validar(devolverEntregaSchema, entrada);
    return { ok: true, datos: await revisar("Devolver", p) };
  } catch (error) {
    return { ok: false, error: errorActividad(error) };
  }
}
