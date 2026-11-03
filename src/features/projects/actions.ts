"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obtenerSesion } from "@/lib/session";
import {
  comprobarError,
  errorPublico,
  ErrorOperacion,
  type Resultado,
} from "@/lib/resultados";
import type { Proyecto } from "@/lib/domain";
import {
  crearProyectoSchema,
  editarProyectoSchema,
  cerrarProyectoSchema,
  validar,
  objetivoSchema,
} from "./validation";
import {
  buscarMiembros,
  consultarProyecto,
  exigirProyecto,
  listarCatalogos,
  type Pagina,
  type PersonaElegible,
} from "./server/queries";

async function exigirQA() {
  const sesion = await obtenerSesion();
  if (sesion.usuario.rol !== "QA") throw new ErrorOperacion("PROHIBIDO");
  return sesion;
}
function refrescar(id: string) {
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`, "layout");
}
export async function buscarMiembrosAction(
  entrada: unknown,
): Promise<Resultado<Pagina<PersonaElegible>>> {
  try {
    return { ok: true, datos: await buscarMiembros(entrada) };
  } catch (error) {
    return { ok: false, error: errorPublico(error) };
  }
}

export async function crearProyectoAction(
  entrada: unknown,
): Promise<Resultado<Proyecto>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(crearProyectoSchema, entrada);
    const catalogos = await listarCatalogos();
    const campos: Record<string, string> = {};
    if (
      p.actividadesTiposIds.some(
        (id) => !catalogos.actividades.some((t) => t.id === id),
      )
    )
      campos.actividadesTiposIds =
        "Selecciona actividades vigentes del catálogo.";
    for (const [i, m] of p.metricas.entries()) {
      const tipo = catalogos.metricas.find((t) => t.id === m.tipoId);
      if (!tipo) {
        campos[`metricas.${i}.tipoId`] = "Selecciona una métrica vigente.";
        continue;
      }
      const porcentaje = objetivoSchema("%", true);
      const objetivo = objetivoSchema(tipo.unidad);
      if (!objetivo.safeParse(m.objetivo).success)
        campos[`metricas.${i}.objetivo`] =
          tipo.unidad === "%"
            ? "Usa un porcentaje mayor que 0 y hasta 100, con hasta cuatro decimales."
            : "Usa un entero entre 0 y 2000000000.";
      if (
        tipo.codigo === "M-01"
          ? !porcentaje.safeParse(m.objetivoCritico).success
          : m.objetivoCritico !== undefined
      )
        campos[`metricas.${i}.objetivoCritico`] =
          "Revisa el objetivo crítico de M-01.";
    }
    if (Object.keys(campos).length)
      throw new ErrorOperacion("DATOS_INVALIDOS", campos);
    const r = await supabase.rpc("crear_proyecto", {
      p_solicitud_id: p.solicitudId,
      p_nombre: p.nombre,
      p_descripcion: p.descripcion,
      p_fecha_inicio: p.fechaInicio,
      p_periodo_academico: p.periodoAcademico ?? undefined,
      p_fecha_fin_prevista: p.fechaFinPrevista ?? undefined,
      p_miembros_ids: p.miembrosIds,
      p_actividades_tipos_ids: p.actividadesTiposIds,
      p_metricas: p.metricas,
    });
    comprobarError(r.error);
    const { id } = z.object({ id: z.uuid() }).parse(r.data);
    const proyecto = await consultarProyecto(id);
    if (!proyecto) throw new ErrorOperacion("FALLO_PERSISTENCIA");
    refrescar(id);
    return { ok: true, datos: proyecto };
  } catch (error) {
    return { ok: false, error: errorPublico(error) };
  }
}

export async function editarProyectoAction(
  entrada: unknown,
): Promise<Resultado<Proyecto>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(editarProyectoSchema, entrada);
    await exigirProyecto(p.proyectoId, true);
    const r = await supabase.rpc("editar_proyecto", {
      p_proyecto_id: p.proyectoId,
      // El generador usa number para bigint. En el transporte se envía la cadena validada, sin convertirla.
      p_version_esperada: p.versionEsperada as unknown as number,
      p_nombre: p.nombre,
      p_descripcion: p.descripcion,
      p_fecha_inicio: p.fechaInicio,
      p_periodo_academico: p.periodoAcademico ?? undefined,
      p_fecha_fin_prevista: p.fechaFinPrevista ?? undefined,
    });
    comprobarError(r.error);
    refrescar(p.proyectoId);
    const proyecto = await consultarProyecto(p.proyectoId);
    if (!proyecto) throw new ErrorOperacion("FALLO_PERSISTENCIA");
    return { ok: true, datos: proyecto };
  } catch (error) {
    return { ok: false, error: errorPublico(error) };
  }
}

export async function cerrarProyectoAction(
  entrada: unknown,
): Promise<Resultado<Proyecto>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(cerrarProyectoSchema, entrada);
    await exigirProyecto(p.proyectoId, true);
    const r = await supabase.rpc("cerrar_proyecto", {
      p_proyecto_id: p.proyectoId,
      p_version_esperada: p.versionEsperada as unknown as number,
    });
    comprobarError(r.error);
    refrescar(p.proyectoId);
    const proyecto = await consultarProyecto(p.proyectoId);
    if (!proyecto) throw new ErrorOperacion("FALLO_PERSISTENCIA");
    return { ok: true, datos: proyecto };
  } catch (error) {
    return { ok: false, error: errorPublico(error) };
  }
}
