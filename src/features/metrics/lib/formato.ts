import { formatValor } from "@/lib/format";
import type { TipoMetrica } from "@/lib/domain";
import type { MetricaProyecto, RevisionMedicion } from "../types";

/** «≥ 90 %» / «≤ 0 defectos». */
export function objetivoTexto(tipo: TipoMetrica, valor: string): string {
  const n = Number(valor);
  return tipo.unidad === "%" ? `${tipo.comparador} ${n} %` : `${tipo.comparador} ${n} ${n === 1 ? "defecto" : "defectos"}`;
}

/** Líneas de objetivo; M-01 muestra general y críticas. */
export function objetivoLineas(m: Pick<MetricaProyecto, "tipo" | "objetivo" | "objetivoCritico">) {
  if (m.tipo.codigo === "M-01" && m.objetivoCritico !== null) {
    return [
      { etiqueta: "general", texto: objetivoTexto(m.tipo, m.objetivo) },
      { etiqueta: "críticas", texto: objetivoTexto(m.tipo, m.objetivoCritico) },
    ];
  }
  return [{ etiqueta: null, texto: objetivoTexto(m.tipo, m.objetivo) }];
}

/** Sin medición ≠ 0; con captura pero denominador 0 → «No disponible». */
export function valorActualTexto(m: Pick<MetricaProyecto, "medidaEn" | "valorActual" | "tipo">): string {
  if (!m.medidaEn) return "Sin medición";
  return m.valorActual === null ? "No disponible" : formatValor(m.valorActual, m.tipo.unidad);
}

export function valorRevisionTexto(r: Pick<RevisionMedicion, "valor">, unidad: TipoMetrica["unidad"]): string {
  return r.valor === null ? "No evaluable" : formatValor(r.valor, unidad);
}

/** Datos fuente legibles: «13 / 18», «47 / 50 · críticas 12 / 12», «1 críticos + 2 altos». */
export function datosLegibles(codigo: string, d: Record<string, number>): string {
  switch (codigo) {
    case "M-01":
      return `${d.aprobadas} / ${d.ejecutadas} · críticas ${d.criticas_aprobadas} / ${d.criticas_ejecutadas}`;
    case "M-02":
      return `${d.integrados_revisados} / ${d.integrados}`;
    case "M-03":
      return `${d.requisitos_probados} / ${d.requisitos_definidos}`;
    default:
      return `${d.criticos_abiertos} críticos + ${d.altos_abiertos} altos`;
  }
}

export function esUrl(fuente: string) {
  return /^https?:\/\//i.test(fuente.trim());
}

/** Etiqueta breve de la fuente: «enlace» para URL, texto tal cual en otro caso. */
export function fuenteCorta(fuente: string) {
  return esUrl(fuente) ? "enlace" : fuente;
}
