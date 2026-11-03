import { z } from "zod";
import { ETAPAS } from "@/lib/catalogs";
import { CLASIFICACIONES_SALUD, ESTADOS_ACTIVIDAD, type EstadoSalud } from "@/lib/domain";
import { uuid } from "@/features/projects/validation";
import { metricaDTO } from "@/features/metrics/dto";
import { conteoGeneral, metricasDeEtapa } from "./lib";
import type { EtapaResumen, ResumenProyecto } from "./types";

/*
 * Adaptación de `public.consultar_resumen` (contratos v1 §6, ADR-003). Cualquier forma
 * inesperada se rechaza: la vista muestra el error de carga (FE-03) en lugar de datos
 * incompletos o incoherentes (DEC-30, RQ-02). La salud la calcula la BD; aquí solo se
 * comprueba que el resultado sea coherente consigo mismo.
 */

const conteo = z.number().int().nonnegative();
const decimal = z.string().regex(/^\d+(\.\d+)?$/);
const advertencia = z.enum(["SIN_ELEMENTOS", "EVALUACION_PARCIAL", "SIN_AVANCE", "DEFECTOS_GRAVES"]);

export const saludSchema = z
  .object({
    estado: z.enum(["Evaluada", "Sin evaluar"]),
    porcentaje: decimal.nullable(),
    clasificacion: z.enum(CLASIFICACIONES_SALUD).nullable(),
    puntos: decimal,
    posibles: conteo,
    actividades: z.object({ total: conteo, aprobadas: conteo }),
    metricas: z.object({ total: conteo, sinDatos: conteo }),
    advertencias: z.array(advertencia),
  })
  .refine((s) => {
    const elementos = s.actividades.total + s.metricas.total;
    if (s.posibles !== elementos || s.actividades.aprobadas > s.actividades.total) return false;
    if (s.metricas.sinDatos > s.metricas.total) return false;
    if (s.estado === "Sin evaluar")
      return elementos === 0 && s.porcentaje === null && s.clasificacion === null;
    if (s.porcentaje === null || s.clasificacion === null || elementos === 0) return false;
    const pct = Number(s.porcentaje);
    return pct >= 0 && pct <= 100;
  }, "Salud incoherente") satisfies z.ZodType<EstadoSalud>;
const salud = saludSchema;
const etapaBD = z.enum(["requerimientos", "diseno", "desarrollo"]);

const evidencia = z.union([
  z.object({ id: uuid, tipo: z.literal("PDF"), nombre: z.string().min(1) }),
  z.object({ id: uuid, tipo: z.literal("Enlace"), url: z.string().regex(/^https?:\/\//i) }),
]);

const resumenJson = z.object({
  proyecto: z.object({
    id: uuid,
    nombre: z.string(),
    descripcion: z.string(),
    periodoAcademico: z.string().nullable(),
    fechaInicio: z.string(),
    fechaFinPrevista: z.string().nullable(),
    cerradoEn: z.string().nullable(),
  }),
  generadoEn: z.string(),
  salud,
  etapas: z.array(
    z.object({
      codigo: etapaBD,
      nombre: z.string(),
      salud,
      conteos: z.object({
        Pendiente: conteo,
        "En progreso": conteo,
        "En revisión": conteo,
        Aprobada: conteo,
      }),
      actividades: z.array(
        z.object({
          id: uuid,
          tipoCodigo: z.string(),
          tipoNombre: z.string(),
          instancia: z.number().int().positive(),
          responsableNombre: z.string().nullable(),
          estado: z.enum(ESTADOS_ACTIVIDAD),
          evidencias: z.array(evidencia),
        }),
      ),
    }),
  ),
  metricas: z.array(z.unknown()),
});

export function resumenDTO(raw: unknown): ResumenProyecto {
  const r = resumenJson.parse(raw);
  const etapas: EtapaResumen[] = r.etapas.map((e) => ({
    codigo: e.codigo === "requerimientos" ? "requisitos" : e.codigo,
    nombre: e.nombre,
    conteos: e.conteos,
    actividades: e.actividades,
    salud: e.salud,
  }));
  // Las tres etapas, sin duplicados y en el orden fijo de las reglas globales.
  if (etapas.map((e) => e.codigo).join() !== ETAPAS.map((e) => e.codigo).join())
    throw new Error("Resumen con etapas incompletas o fuera de orden");
  // DEC-30 (RQ-02): la salud debe corresponder a los mismos elementos que se muestran.
  const metricas = r.metricas.map(metricaDTO);
  const coherente = (salud: EstadoSalud, conteos: EtapaResumen["conteos"], m: typeof metricas) =>
    salud.actividades.total === Object.values(conteos).reduce((a, b) => a + b, 0) &&
    salud.actividades.aprobadas === conteos.Aprobada &&
    salud.metricas.total === m.length;
  const general = conteoGeneral({ etapas });
  if (
    !coherente(r.salud, general, metricas) ||
    etapas.some((e) => !coherente(e.salud, e.conteos, metricasDeEtapa(metricas, e.codigo)))
  )
    throw new Error("Salud incoherente con actividades y métricas del resumen");
  return {
    proyecto: r.proyecto,
    generadoEn: r.generadoEn,
    salud: r.salud,
    etapas,
    metricas,
  };
}
