import type {
  ConteoEstados,
  EstadoActividad,
  EstadoSalud,
  EtapaCodigo,
} from "@/lib/domain";
import type { MetricaProyecto } from "@/features/metrics/types";

/*
 * DTO del resumen de calidad (contratos v1 §6, `consultarResumen`). Lo comparten la vista
 * de salud (CU-05) y el reporte (CU-06): ambos deben mostrar las mismas cifras. Es JSON
 * serializable (sin Date ni clases) para poder incluirse en la captura cifrada de CU-06.
 *
 * Salud: fórmula y clasificación de DEC-27 calculadas por la BD (`private.salud_json`); la
 * interfaz solo las presenta. Dashboard, vista del reporte y PDF usan este mismo DTO.
 */

export type ProyectoResumen = {
  id: string;
  nombre: string;
  descripcion: string;
  periodoAcademico: string | null;
  /** AAAA-MM-DD */
  fechaInicio: string;
  /** AAAA-MM-DD */
  fechaFinPrevista: string | null;
  /** ISO; los proyectos cerrados también se consultan. */
  cerradoEn: string | null;
};

/**
 * Referencia a una evidencia del último intento enviado (DEC-28). El PDF no se incrusta: se
 * descarga por `/api/evidencias/{id}/archivo`, que vuelve a autorizar por proyecto.
 */
export type EvidenciaResumen =
  | { id: string; tipo: "PDF"; nombre: string }
  | { id: string; tipo: "Enlace"; url: string };

/** Fila resumida de actividad SQA; el detalle completo se consulta en CU-03. */
export type ActividadEtapaResumen = {
  id: string;
  tipoCodigo: string;
  tipoNombre: string;
  /** Número de instancia del tipo en el proyecto (1, 2…), por orden de creación. */
  instancia: number;
  responsableNombre: string | null;
  estado: EstadoActividad;
  evidencias: EvidenciaResumen[];
};

export type EtapaResumen = {
  codigo: EtapaCodigo;
  nombre: string;
  /** Conteo por los cuatro estados, calculado por la BD en la misma lectura. */
  conteos: ConteoEstados;
  /** Orden de creación (creado_en, id). */
  actividades: ActividadEtapaResumen[];
  salud: EstadoSalud;
};

export type ResumenProyecto = {
  proyecto: ProyectoResumen;
  /** ISO; instante de la lectura consistente en la BD. */
  generadoEn: string;
  salud: EstadoSalud;
  /** Siempre las tres etapas, en orden fijo: requisitos, diseño, desarrollo. */
  etapas: EtapaResumen[];
  /** Métricas configuradas, por código de tipo, con valor y cumplimiento de la medición vigente. */
  metricas: MetricaProyecto[];
};
