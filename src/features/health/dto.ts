import { z } from "zod";
import { ETAPAS } from "@/lib/catalogs";
import { ESTADOS_ACTIVIDAD } from "@/lib/domain";
import { uuid } from "@/features/projects/validation";
import { metricaDTO } from "@/features/metrics/dto";
import type { EtapaResumen, ResumenProyecto } from "./types";

/*
 * Adaptación de `public.consultar_resumen` (contratos v1 §6). Cualquier forma inesperada
 * se rechaza: la vista muestra el error de carga en lugar de datos incompletos.
 * La salud se valida como literal: si la BD devolviera otra clasificación sin un
 * algoritmo aprobado, el resumen no se acepta.
 */

const salud = z.object({
  estado: z.literal("Sin evaluar"),
  motivo: z.literal("Algoritmo pendiente"),
});
const conteo = z.number().int().nonnegative();
const etapaBD = z.enum(["requerimientos", "diseno", "desarrollo"]);

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
          responsableNombre: z.string().nullable(),
          estado: z.enum(ESTADOS_ACTIVIDAD),
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
  return {
    proyecto: r.proyecto,
    generadoEn: r.generadoEn,
    salud: r.salud,
    etapas,
    metricas: r.metricas.map(metricaDTO),
  };
}
