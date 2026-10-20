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
import type {
  HistorialCorrecciones,
  MetricaProyecto,
  PaginaMediciones,
} from "./types";
import {
  consultarMetrica,
  listarCorrecciones,
  listarMediciones,
  metricaDeMedicion,
  proyectoDeMetrica,
} from "./server/queries";
import { metricaDTO } from "./dto";
import {
  agregarMetricaSchema,
  configurarObjetivoSchema,
  corregirMedicionSchema,
  datosFuenteDeTipo,
  medidaEnISO,
  objetivosDeTipo,
  registrarMedicionSchema,
} from "./validation";

const MENSAJE_NO_DISPONIBLE =
  "Esta métrica no está disponible. Vuelve al listado de métricas.";

async function exigirQA() {
  const sesion = await obtenerSesion();
  if (sesion.usuario.rol !== "QA") throw new ErrorOperacion("PROHIBIDO");
  return sesion;
}
function refrescar(proyectoId: string) {
  revalidatePath(`/proyectos/${proyectoId}`, "layout");
}
function errorMetrica(error: unknown): ErrorPublico {
  const e = errorPublico(error);
  return e.codigo === "NO_DISPONIBLE"
    ? { ...e, mensaje: MENSAJE_NO_DISPONIBLE }
    : e;
}
/** Métrica gestionable: QA participante y proyecto abierto; la RPC vuelve a autorizar. */
async function metricaGestionable(metricaProyectoId: string) {
  const proyectoId = await proyectoDeMetrica(metricaProyectoId);
  await exigirProyecto(proyectoId, true);
  return consultarMetrica(metricaProyectoId);
}
const medicionRPC = z.object({
  id: uuid,
  revisionActual: z.number().int(),
  metrica: z.unknown(),
});
export type ResultadoMedicion = {
  metrica: MetricaProyecto;
  revisionActual: number;
  /** registrar_medicion: el reintento devolvió la medición ya guardada. */
  reutilizada: boolean;
};

export async function consultarMetricaAction(
  entrada: unknown,
): Promise<Resultado<MetricaProyecto>> {
  try {
    const id = validar(uuid, entrada);
    await proyectoDeMetrica(id);
    return { ok: true, datos: await consultarMetrica(id) };
  } catch (error) {
    return { ok: false, error: errorMetrica(error) };
  }
}

export async function listarMedicionesAction(
  entrada: unknown,
): Promise<Resultado<PaginaMediciones>> {
  try {
    return { ok: true, datos: await listarMediciones(entrada) };
  } catch (error) {
    return { ok: false, error: errorMetrica(error) };
  }
}

export async function listarCorreccionesAction(
  entrada: unknown,
): Promise<Resultado<HistorialCorrecciones>> {
  try {
    return { ok: true, datos: await listarCorrecciones(entrada) };
  } catch (error) {
    return { ok: false, error: errorMetrica(error) };
  }
}

/** SF-05: tipo vigente del catálogo, no configurado; queda Sin medición. */
export async function agregarMetricaAction(
  entrada: unknown,
): Promise<Resultado<MetricaProyecto>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(agregarMetricaSchema, entrada);
    await exigirProyecto(p.proyectoId, true);
    const catalogos = await listarCatalogos();
    const tipo = catalogos.metricas.find((t) => t.id === p.tipoId);
    if (!tipo)
      throw new ErrorOperacion("DATOS_INVALIDOS", {
        tipoId: "Elige una métrica vigente del catálogo.",
      });
    const o = objetivosDeTipo(tipo, p.objetivo, p.objetivoCritico);
    const r = await supabase.rpc("agregar_metrica", {
      p_proyecto_id: p.proyectoId,
      p_tipo_id: tipo.id,
      // El generador usa number para numeric. Se envía la cadena validada, sin pasar por Number.
      p_objetivo: o.objetivo as unknown as number,
      p_objetivo_critico: (o.objetivoCritico ?? undefined) as unknown as number,
    });
    comprobarError(r.error);
    refrescar(p.proyectoId);
    return { ok: true, datos: metricaDTO(r.data) };
  } catch (error) {
    const e = errorPublico(error);
    // FE-02: la restricción única convierte el duplicado en CONFLICTO.
    return e.codigo === "CONFLICTO"
      ? {
          ok: false,
          error: {
            ...e,
            mensaje:
              "Esta métrica ya está configurada en el proyecto. Recarga para ver su estado actual.",
          },
        }
      : { ok: false, error: e };
  }
}

/** SF-03: compara el token de configuración anterior; un cambio concurrente no se sobrescribe. */
export async function configurarObjetivoAction(
  entrada: unknown,
): Promise<Resultado<MetricaProyecto>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(configurarObjetivoSchema, entrada);
    const actual = await metricaGestionable(p.metricaProyectoId);
    const o = objetivosDeTipo(actual.tipo, p.objetivo, p.objetivoCritico);
    const r = await supabase.rpc("configurar_objetivo", {
      p_metrica_proyecto_id: p.metricaProyectoId,
      p_configurada_en_esperada: p.configuradaEnEsperada,
      p_objetivo: o.objetivo as unknown as number,
      p_objetivo_critico: (o.objetivoCritico ?? undefined) as unknown as number,
    });
    comprobarError(r.error);
    refrescar(actual.proyectoId);
    return { ok: true, datos: metricaDTO(r.data) };
  } catch (error) {
    return { ok: false, error: errorMetrica(error) };
  }
}

/** SF-02: medicionId estable del formulario; reintentar con los mismos datos no duplica. */
export async function registrarMedicionAction(
  entrada: unknown,
): Promise<Resultado<ResultadoMedicion>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(registrarMedicionSchema, entrada);
    const actual = await metricaGestionable(p.metricaProyectoId);
    const datos = datosFuenteDeTipo(actual.tipo, p.conteos, p.fuenteReferencia);
    const r = await supabase.rpc("registrar_medicion", {
      p_medicion_id: p.medicionId,
      p_metrica_proyecto_id: p.metricaProyectoId,
      p_medida_en: medidaEnISO(p.medidaEn),
      p_datos_fuente: datos,
    });
    comprobarError(r.error);
    const m = medicionRPC
      .extend({ reutilizada: z.boolean() })
      .parse(r.data);
    refrescar(actual.proyectoId);
    return {
      ok: true,
      datos: {
        metrica: metricaDTO(m.metrica),
        revisionActual: m.revisionActual,
        reutilizada: m.reutilizada,
      },
    };
  } catch (error) {
    return { ok: false, error: errorMetrica(error) };
  }
}

/** SF-04: nueva revisión inmutable sobre la revisión esperada; no cambia la fecha ni el orden. */
export async function corregirMedicionAction(
  entrada: unknown,
): Promise<Resultado<ResultadoMedicion>> {
  try {
    const { supabase } = await exigirQA();
    const p = validar(corregirMedicionSchema, entrada);
    const actual = await metricaGestionable(
      await metricaDeMedicion(p.medicionId),
    );
    const datos = datosFuenteDeTipo(actual.tipo, p.conteos, p.fuenteReferencia);
    const r = await supabase.rpc("corregir_medicion", {
      p_medicion_id: p.medicionId,
      p_revision_esperada: p.revisionEsperada,
      p_datos_fuente: datos,
    });
    comprobarError(r.error);
    const m = medicionRPC.parse(r.data);
    refrescar(actual.proyectoId);
    return {
      ok: true,
      datos: {
        metrica: metricaDTO(m.metrica),
        revisionActual: m.revisionActual,
        reutilizada: false,
      },
    };
  } catch (error) {
    return { ok: false, error: errorMetrica(error) };
  }
}
