import type { EstadoCumplimiento, MetricaVista } from "@/lib/domain";
import { cumplimientoEtiqueta } from "@/components/status/status-badges";

export const ESTADOS_CUMPLIMIENTO: readonly EstadoCumplimiento[] = [
  "Cumple",
  "Incumple",
  "No evaluable",
  "Sin medición",
];

function unidad(m: MetricaVista) {
  return m.tipo.unidad === "%" ? " %" : m.tipo.unidad === "defectos" ? " defectos" : "";
}

/** «general ≥ 90 %» / «críticas ≥ 100 %» / «≤ 0 defectos». */
export function objetivoTexto(m: MetricaVista): { principal: string; critico: string | null } {
  const c = m.tipo.comparador;
  const tieneCritico = m.objetivoCritico !== null;
  return {
    principal: `${tieneCritico ? "general " : ""}${c} ${Number(m.objetivo)}${unidad(m)}`,
    critico: tieneCritico ? `críticas ${c} ${Number(m.objetivoCritico)}${unidad(m)}` : null,
  };
}

/** Datos fuente de la medición vigente: «Ejecutadas: 18 · Aprobadas: 17». */
export function datosFuenteTexto(m: MetricaVista): string | null {
  const vigente = m.medicionVigente;
  if (!vigente) return null;
  const rev = vigente.revisiones[vigente.revisiones.length - 1]!;
  return m.tipo.campos
    .filter((c) => rev.datosFuente[c.clave] !== undefined)
    .map((c) => `${c.etiqueta}: ${rev.datosFuente[c.clave]}`)
    .join(" · ");
}

/** «1 Cumple · 1 No cumple · 1 Sin medición» (omite ceros). */
export function resumenCumplimiento(metricas: MetricaVista[]): string {
  return ESTADOS_CUMPLIMIENTO.map((e) => ({ e, n: metricas.filter((m) => m.cumplimiento === e).length }))
    .filter((x) => x.n > 0)
    .map((x) => `${x.n} ${cumplimientoEtiqueta(x.e)}`)
    .join(" · ");
}
