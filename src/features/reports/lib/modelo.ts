import { cumplimientoEtiqueta } from "@/components/status/status-badges";
import { nombreEtapa } from "@/lib/catalogs";
import {
  ESTADOS_ACTIVIDAD,
  type ClasificacionSalud,
  type EstadoActividad,
  type EstadoCumplimiento,
  type EstadoSalud,
} from "@/lib/domain";
import { formatDia, formatFecha, formatFechaHora, formatRango, ROTULO_ZONA, selloFechaHora } from "@/lib/format";
import { advertenciasTexto, aporteTexto, conteoGeneral, NOTA_SALUD, puntosTexto } from "@/features/health/lib";
import type { EvidenciaResumen, ResumenProyecto } from "@/features/health/types";
import { objetivoLineas, valorActualTexto } from "@/features/metrics/lib/formato";
import type { MetricaProyecto } from "@/features/metrics/types";

/*
 * Modelo de presentación del reporte de calidad (CU-06). Una única función convierte la
 * captura (resumen de CU-05 + fecha de emisión) en los textos que muestran la vista web y el
 * PDF, de modo que ambos tengan el mismo contenido (DEC-28). Solo da formato: salud,
 * clasificación, aportes, advertencias, valores, cumplimiento y conteos vienen de la BD
 * (mismo resumen de CU-05), así dashboard, vista y PDF coinciden para la misma captura.
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
  /** Solo M-01: criterio independiente de pruebas críticas (DEC-26). */
  criterioCritico: string | null;
  /** «0.80 de 1» o «0 (sin datos)». */
  aporte: string;
  estadoMedicion: string;
  fechaMedicion: string;
};

/** Referencia a evidencia: el PDF no se incrusta; el enlace pasa por la ruta autorizada. */
export type EvidenciaReporte = { id: string; texto: string; href: string };

export type ActividadReporte = {
  id: string;
  codigo: string;
  nombre: string;
  /** Número de instancia del tipo en el proyecto (1, 2…). */
  instancia: number;
  responsable: string;
  estado: EstadoActividad;
  evidencias: EvidenciaReporte[];
};

/** Salud de un ámbito ya redactada para vista y PDF. */
export type SaludReporte = {
  salud: EstadoSalud;
  /** «68.57 %» o «Sin evaluar». */
  porcentaje: string;
  clasificacion: ClasificacionSalud | null;
  /** «4.8 de 7 puntos» o «Sin elementos». */
  puntos: string;
  advertencias: string[];
};

export type EtapaReporte = {
  codigo: string;
  nombre: string;
  salud: SaludReporte;
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
  /** «20 oct 2026, 10:42 (hora de CDMX)». */
  fechaGeneracion: string;
  metricas: MetricaReporte[];
  actividades: { total: number; conteos: ConteoFila[] };
  salud: { general: SaludReporte; nota: string };
  etapas: EtapaReporte[];
  /** Advertencias de todos los ámbitos, con su ámbito como prefijo («Desarrollo: …»). */
  advertencias: string[];
};

function saludReporte(s: EstadoSalud): SaludReporte {
  return {
    salud: s,
    porcentaje: s.estado === "Evaluada" ? `${s.porcentaje} %` : "Sin evaluar",
    clasificacion: s.clasificacion,
    puntos: s.estado === "Evaluada" ? puntosTexto(s) : "Sin elementos",
    advertencias: advertenciasTexto(s),
  };
}

function evidenciaReporte(e: EvidenciaResumen, origen: string): EvidenciaReporte {
  return e.tipo === "PDF"
    ? { id: e.id, texto: `${e.nombre} (PDF privado en QAlly)`, href: `${origen}/api/evidencias/${e.id}/archivo` }
    : { id: e.id, texto: e.url, href: e.url };
}

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

/**
 * `origen` (p. ej. «https://qally.example») solo se usa en el PDF para que los enlaces a
 * evidencias PDF sean absolutos; la vista web usa rutas relativas. Ambas rutas exigen sesión.
 */
export function modeloReporte(resumen: ResumenProyecto, emitidaEn: string, origen = ""): ModeloReporte {
  const { proyecto } = resumen;
  const general = conteoGeneral(resumen);
  const saludGeneral = saludReporte(resumen.salud);
  const etapas: EtapaReporte[] = resumen.etapas.map((e) => ({
    codigo: e.codigo,
    nombre: e.nombre,
    salud: saludReporte(e.salud),
    conteos: filas(e.conteos),
    total: total(e.conteos),
    actividades: e.actividades.map((a) => ({
      id: a.id,
      codigo: a.tipoCodigo,
      nombre: a.tipoNombre,
      instancia: a.instancia,
      responsable: a.responsableNombre ?? "Sin responsable",
      estado: a.estado,
      evidencias: a.evidencias.map((ev) => evidenciaReporte(ev, origen)),
    })),
  }));
  return {
    proyecto: {
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      periodoAcademico: proyecto.periodoAcademico,
      fechas: formatRango(proyecto.fechaInicio, proyecto.fechaFinPrevista),
      estado: proyecto.cerradoEn ? `Cerrado el ${formatFecha(proyecto.cerradoEn)}` : "Abierto",
    },
    emitidaEn,
    fechaGeneracion: `${formatFechaHora(emitidaEn)} (${ROTULO_ZONA})`,
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
      criterioCritico:
        m.cumplimientoCritico && m.cumplimientoCritico !== "Sin medición"
          ? `Críticas (criterio independiente): ${cumplimientoEtiqueta(m.cumplimientoCritico)}`
          : null,
      aporte: aporteTexto(m.aporte),
      estadoMedicion: estadoMedicion(m),
      fechaMedicion: m.medidaEn ? formatDia(m.medidaEn) : "Sin fecha de medición",
    })),
    actividades: { total: total(general), conteos: filas(general) },
    salud: { general: saludGeneral, nota: NOTA_SALUD_REPORTE },
    etapas,
    advertencias: [
      ...saludGeneral.advertencias.map((t) => `General: ${t}`),
      ...etapas.flatMap((e) => e.salud.advertencias.map((t) => `${e.nombre}: ${t}`)),
    ],
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
  return `reporte-calidad-${base}-${selloFechaHora(emitidaEn)}.pdf`;
}
