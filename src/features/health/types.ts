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
 * Salud: algoritmo y clasificación PENDIENTES. Solo existe «Sin evaluar»; no hay
 * porcentajes, pesos, puntajes ni categorías.
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

/** Fila resumida de actividad SQA; el detalle completo se consulta en CU-03. */
export type ActividadEtapaResumen = {
  id: string;
  tipoCodigo: string;
  tipoNombre: string;
  responsableNombre: string | null;
  estado: EstadoActividad;
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
