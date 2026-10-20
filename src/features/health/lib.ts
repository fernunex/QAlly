import type {
  ConteoEstados,
  EstadoCumplimiento,
  EtapaCodigo,
  TipoMetrica,
} from "@/lib/domain";
import { ESTADOS_ACTIVIDAD } from "@/lib/domain";
import { cumplimientoEtiqueta } from "@/components/status/status-badges";
import type { ResumenProyecto } from "./types";

/*
 * Utilidades puras sobre el resumen (CU-05/CU-06). Solo cuentan y agrupan datos que ya
 * entrega la BD; no calculan salud, porcentajes, pesos ni categorías.
 */

/** Aviso común de CU-05 y CU-06 mientras el algoritmo de salud esté PENDIENTE. */
export const NOTA_SALUD =
  "La salud aún no se calcula: el algoritmo y su clasificación están pendientes de aprobación. Se muestran solo los datos reales del proyecto.";

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
