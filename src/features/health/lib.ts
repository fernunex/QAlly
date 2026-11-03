import type {
  AdvertenciaSalud,
  ConteoEstados,
  EstadoSalud,
  EstadoCumplimiento,
  EtapaCodigo,
  TipoMetrica,
} from "@/lib/domain";
import { ESTADOS_ACTIVIDAD } from "@/lib/domain";
import { cumplimientoEtiqueta } from "@/components/status/status-badges";
import type { ResumenProyecto } from "./types";

/*
 * Utilidades puras sobre el resumen (CU-05/CU-06). Solo cuentan, agrupan y redactan datos que
 * ya entrega la BD: porcentaje, clasificación y advertencias vienen calculados (DEC-27).
 */

/** Explicación común de CU-05 y CU-06 (reglas globales, «Salud aprobada»). */
export const NOTA_SALUD =
  "Salud = 100 × (actividades Aprobadas + suma de aportes de métricas) / (actividades planeadas + métricas seleccionadas). Cada actividad y cada métrica vale 1 punto posible; solo Aprobada cuenta como realizada. Clasificación: Malo < 50 %, Regular < 70 %, Bueno < 90 %, Excelente ≥ 90 %, con el valor sin redondear.";

/** «68.57 % · Regular» o «Sin evaluar». */
export function saludTexto(s: EstadoSalud): string {
  return s.estado === "Evaluada" ? `${s.porcentaje} % · ${s.clasificacion}` : "Sin evaluar";
}

/** «4.8 de 7 puntos». */
export function puntosTexto(s: EstadoSalud): string {
  return `${s.puntos} de ${s.posibles} ${s.posibles === 1 ? "punto" : "puntos"}`;
}

/** Texto de cada advertencia; el ámbito ya se indica en el contenedor. */
export function textoAdvertencia(a: AdvertenciaSalud, s: EstadoSalud): string {
  switch (a) {
    case "SIN_ELEMENTOS":
      return "Sin actividades SQA ni métricas: no hay elementos que evaluar.";
    case "EVALUACION_PARCIAL": {
      const n = s.metricas.sinDatos;
      return `Evaluación parcial: ${n} ${n === 1 ? "métrica" : "métricas"} sin medición o no evaluable aporta 0 y sigue contando como punto posible.`;
    }
    case "SIN_AVANCE":
      return "0 % evaluado: hay elementos planeados, pero ninguna actividad Aprobada ni métrica con aporte. Faltan datos.";
    case "DEFECTOS_GRAVES":
      return "Defectos graves abiertos: la última medición de M-04 es mayor que 0. No limita la puntuación.";
  }
}

export function advertenciasTexto(s: EstadoSalud): string[] {
  return s.advertencias.map((a) => textoAdvertencia(a, s));
}

/** «0.80 de 1»; null si la métrica no aporta por falta de datos. */
export function aporteTexto(aporte: string | null): string {
  return aporte === null ? "0 (sin datos)" : `${Number(aporte).toFixed(2)} de 1`;
}

export const ESTADOS_CUMPLIMIENTO: readonly EstadoCumplimiento[] = [
  "Cumple",
  "Incumple",
  "No evaluable",
  "Sin medición",
];

/** Suma de los conteos por estado de las tres etapas. */
export function conteoGeneral(resumen: Pick<ResumenProyecto, "etapas">): ConteoEstados {
  const total = Object.fromEntries(ESTADOS_ACTIVIDAD.map((e) => [e, 0])) as ConteoEstados;
  for (const etapa of resumen.etapas)
    for (const e of ESTADOS_ACTIVIDAD) total[e] += etapa.conteos[e];
  return total;
}

/** Métricas cuyo tipo pertenece a la etapa (ADR-002: las cuatro v1 son de Desarrollo). */
export function metricasDeEtapa<M extends { tipo: { etapaCodigo: EtapaCodigo } }>(
  metricas: M[],
  etapa: EtapaCodigo,
): M[] {
  return metricas.filter((m) => m.tipo.etapaCodigo === etapa);
}

/** Número de métricas por estado de cumplimiento. Cumplimiento de métricas no es salud. */
export function contarCumplimiento(
  metricas: { cumplimiento: EstadoCumplimiento }[],
): Record<EstadoCumplimiento, number> {
  const conteo = Object.fromEntries(ESTADOS_CUMPLIMIENTO.map((e) => [e, 0])) as Record<
    EstadoCumplimiento,
    number
  >;
  for (const m of metricas) conteo[m.cumplimiento]++;
  return conteo;
}

/** «1 Cumple · 1 No cumple · 1 Sin medición» (omite ceros). */
export function resumenCumplimiento(metricas: { cumplimiento: EstadoCumplimiento }[]): string {
  const conteo = contarCumplimiento(metricas);
  return ESTADOS_CUMPLIMIENTO.filter((e) => conteo[e] > 0)
    .map((e) => `${conteo[e]} ${cumplimientoEtiqueta(e)}`)
    .join(" · ");
}

function unidad(tipo: Pick<TipoMetrica, "unidad">) {
  return tipo.unidad === "%" ? " %" : tipo.unidad === "defectos" ? " defectos" : "";
}

/** «general ≥ 90 %» / «críticas ≥ 100 %» / «≤ 0 defectos». */
export function objetivoTexto(m: {
  tipo: Pick<TipoMetrica, "comparador" | "unidad">;
  objetivo: string;
  objetivoCritico: string | null;
}): { principal: string; critico: string | null } {
  const c = m.tipo.comparador;
  const tieneCritico = m.objetivoCritico !== null;
  return {
    principal: `${tieneCritico ? "general " : ""}${c} ${Number(m.objetivo)}${unidad(m.tipo)}`,
    critico: tieneCritico ? `críticas ${c} ${Number(m.objetivoCritico)}${unidad(m.tipo)}` : null,
  };
}
