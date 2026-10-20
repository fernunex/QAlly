import { z } from "zod";
import { TIPOS_METRICA } from "@/lib/catalogs";
import { uuid } from "@/features/projects/validation";
import type { MetricaProyecto } from "./types";

const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);
const condicion = z.enum(["Sin medición", "Evaluable", "No evaluable"]);
// Forma de private.metrica_json (contratos v1 §4); numéricos convertidos a texto en la BD.
const metricaJson = z.object({
  id: uuid,
  proyectoId: uuid,
  tipo: z.object({
    id: uuid,
    codigo: z.string(),
    nombre: z.string(),
    etapaCodigo: z.string(),
    unidad: z.enum(["%", "defectos"]),
  }),
  objetivo: decimal,
  objetivoCritico: decimal.nullable(),
  valorActual: decimal.nullable(),
  condicionPrincipal: condicion,
  causa: z.string().nullable(),
  cumplimiento: z.enum(["Cumple", "Incumple", "No evaluable"]),
  valorCritico: decimal.nullable(),
  condicionCritica: condicion,
  causaCritica: z.string().nullable(),
  medidaEn: z.string().nullable(),
  configuradaEn: z.string(),
});

function etapaUI(codigo: string) {
  const etapa = z
    .enum(["requerimientos", "diseno", "desarrollo"])
    .parse(codigo);
  return etapa === "requerimientos" ? "requisitos" : etapa;
}

export function metricaDTO(raw: unknown): MetricaProyecto {
  const m = metricaJson.parse(raw);
  const meta = TIPOS_METRICA.find((t) => t.codigo === m.tipo.codigo);
  if (!meta) throw new Error("Catálogo no compatible con las definiciones v1");
  return {
    id: m.id,
    proyectoId: m.proyectoId,
    // Fórmula, campos y objetivos iniciales son metadata v1; identidad y textos vienen de la BD.
    tipo: {
      ...meta,
      id: m.tipo.id,
      nombre: m.tipo.nombre,
      etapaCodigo: etapaUI(m.tipo.etapaCodigo),
      unidad: m.tipo.unidad,
    },
    objetivo: m.objetivo,
    objetivoCritico: m.objetivoCritico,
    configuradaEn: m.configuradaEn,
    valorActual: m.valorActual,
    condicionPrincipal: m.condicionPrincipal,
    causa: m.causa,
    valorCritico: m.valorCritico,
    condicionCritica: m.condicionCritica,
    causaCritica: m.causaCritica,
    cumplimiento:
      m.condicionPrincipal === "Sin medición" ? "Sin medición" : m.cumplimiento,
    medidaEn: m.medidaEn,
  };
}
