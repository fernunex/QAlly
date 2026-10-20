import { cumplimientoEtiqueta } from "@/components/status/status-badges";
import { nombreEtapa } from "@/lib/catalogs";
import {
  ESTADOS_ACTIVIDAD,
  type EstadoActividad,
  type EstadoCumplimiento,
  type EstadoSalud,
} from "@/lib/domain";
import { formatFecha, formatFechaHora, formatRango } from "@/lib/format";
import { conteoGeneral, NOTA_SALUD } from "@/features/health/lib";
import type { ResumenProyecto } from "@/features/health/types";
import { objetivoLineas, valorActualTexto } from "@/features/metrics/lib/formato";
import type { MetricaProyecto } from "@/features/metrics/types";

/*
 * Modelo de presentación del reporte de calidad (CU-06). Una única función convierte la
 * captura (resumen de CU-05 + fecha de emisión) en los textos que muestran la vista web y el
 * PDF, de modo que ambos tengan el mismo contenido. Solo da formato: no calcula salud,
 * porcentajes, pesos ni categorías; valores, cumplimiento y conteos vienen de la BD.
 */

export const NOTA_SALUD_REPORTE = `${NOTA_SALUD} Cumplir una métrica no es lo mismo que tener buena salud.`;

export type ConteoFila = { estado: EstadoActividad; cantidad: number };

export type MetricaReporte = {
  id: string;
  codigo: string;
  nombre: string;
  etapa: string;
  /** «95.00 %», «Sin medición» o «No disponible»; nunca 0 por ausencia de datos. */
  ultimoValor: string;
  valorCritico: string | null;
  objetivo: string;
  cumplimiento: EstadoCumplimiento;
  cumplimientoTexto: string;
  estadoMedicion: string;
  fechaMedicion: string;
};

export type ActividadReporte = {
  id: string;
  codigo: string;
  nombre: string;
  responsable: string;
  estado: EstadoActividad;
};

export type EtapaReporte = {
  codigo: string;
  nombre: string;
  salud: EstadoSalud;
  conteos: ConteoFila[];
  total: number;
  actividades: ActividadReporte[];
};

export type ModeloReporte = {
  proyecto: {
    nombre: string;
    descripcion: string;
    periodoAcademico: string | null;
    fechas: string;
    estado: string;
  };
  /** ISO de emisión de la captura. */
  emitidaEn: string;
  /** «20 oct 2026, 10:42 (UTC)». */
  fechaGeneracion: string;
  metricas: MetricaReporte[];
  actividades: { total: number; conteos: ConteoFila[] };
  salud: { general: EstadoSalud; nota: string };
  etapas: EtapaReporte[];
};

function filas(conteos: Record<EstadoActividad, number>): ConteoFila[] {
  return ESTADOS_ACTIVIDAD.map((estado) => ({ estado, cantidad: conteos[estado] }));
}

function total(conteos: Record<EstadoActividad, number>) {
  return ESTADOS_ACTIVIDAD.reduce((s, e) => s + conteos[e], 0);
}

/** Mismo criterio que la tarjeta de CU-05: sin medición se indica explícitamente. */
function estadoMedicion(m: MetricaProyecto): string {
  if (!m.medidaEn) return "Sin medición (no equivale a 0)";
  const causas = [m.causa, m.causaCritica].filter(Boolean).join(" · ");
  return causas ? `${m.condicionPrincipal} · ${causas}` : m.condicionPrincipal;
}

export function modeloReporte(resumen: ResumenProyecto, emitidaEn: string): ModeloReporte {
  const { proyecto } = resumen;
  const general = conteoGeneral(resumen);
  return {
    proyecto: {
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      periodoAcademico: proyecto.periodoAcademico,
      fechas: formatRango(proyecto.fechaInicio, proyecto.fechaFinPrevista),
      estado: proyecto.cerradoEn ? `Cerrado el ${formatFecha(proyecto.cerradoEn)}` : "Abierto",
    },
    emitidaEn,
    fechaGeneracion: `${formatFechaHora(emitidaEn)} (UTC)`,
    metricas: resumen.metricas.map((m) => ({
      id: m.id,
      codigo: m.tipo.codigo,
      nombre: m.tipo.nombre,
      etapa: nombreEtapa(m.tipo.etapaCodigo),
      ultimoValor: valorActualTexto(m),
      valorCritico: m.valorCritico ? `Críticas: ${Number(m.valorCritico).toFixed(2)} %` : null,
      objetivo: objetivoLineas(m)
        .map((l) => (l.etiqueta ? `${l.etiqueta} ${l.texto}` : l.texto))
        .join(" · "),
      cumplimiento: m.cumplimiento,
      cumplimientoTexto: cumplimientoEtiqueta(m.cumplimiento),
      estadoMedicion: estadoMedicion(m),
      fechaMedicion: m.medidaEn ? formatFecha(m.medidaEn) : "Sin fecha de medición",
    })),
    actividades: { total: total(general), conteos: filas(general) },
    salud: { general: resumen.salud, nota: NOTA_SALUD_REPORTE },
    etapas: resumen.etapas.map((e) => ({
      codigo: e.codigo,
      nombre: e.nombre,
      salud: e.salud,
      conteos: filas(e.conteos),
      total: total(e.conteos),
      actividades: e.actividades.map((a) => ({
        id: a.id,
        codigo: a.tipoCodigo,
        nombre: a.tipoNombre,
        responsable: a.responsableNombre ?? "Sin responsable",
        estado: a.estado,
      })),
    })),
  };
}

/** «reporte-calidad-proyecto-x-20261020-1042.pdf»: ASCII, sin rutas ni separadores. */
export function nombreArchivoReporte(nombreProyecto: string, emitidaEn: string): string {
  const base =
    nombreProyecto
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "proyecto";
  const d = new Date(emitidaEn);
  const p = (n: number) => String(n).padStart(2, "0");
  const sello = `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
  return `reporte-calidad-${base}-${sello}.pdf`;
}
