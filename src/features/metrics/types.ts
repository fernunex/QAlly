import type { EstadoCumplimiento, TipoMetrica } from "@/lib/domain";

/*
 * DTO de CU-02 (contratos v1 §2 y §4). Decimales y fechas se transportan como cadenas
 * exactas: configuradaEn es el token de concurrencia de configurar_objetivo.
 */

export type CondicionMedicion = "Sin medición" | "Evaluable" | "No evaluable";

export type MetricaProyecto = {
  id: string;
  proyectoId: string;
  tipo: TipoMetrica;
  objetivo: string;
  objetivoCritico: string | null;
  configuradaEn: string;
  /** null sin medición o con medición No evaluable. */
  valorActual: string | null;
  condicionPrincipal: CondicionMedicion;
  causa: string | null;
  /** Solo M-01. */
  valorCritico: string | null;
  condicionCritica: CondicionMedicion;
  causaCritica: string | null;
  /** Solo M-01: criterio independiente de pruebas críticas (DEC-26); no afecta cumplimiento ni salud. */
  cumplimientoCritico: EstadoCumplimiento | null;
  /** Aporte C_i a la salud en [0,1] (DEC-27); null = Sin medición / No evaluable, aporta 0. */
  aporte: string | null;
  /** «Sin medición» cuando no hay mediciones; si no, el cumplimiento del valor general. */
  cumplimiento: EstadoCumplimiento;
  /** Fecha de la medición vigente (ISO); null = Sin medición. */
  medidaEn: string | null;
};

export type RevisionMedicion = {
  numero: number;
  datosFuente: Record<string, number>;
  /** Opcional (DEC-26). */
  fuenteReferencia: string | null;
  valor: string | null;
  causa: string | null;
  autorNombre: string;
  registradaEn: string;
};

export type Medicion = {
  id: string;
  /** ISO; la fecha de medición se captura como día y se guarda a las 00:00 UTC. */
  medidaEn: string;
  /** Última revisión; las anteriores se consultan con listarRevisiones. */
  revision: RevisionMedicion;
};

export type CorreccionMedicion = RevisionMedicion & {
  /** Valor de la revisión inmediatamente anterior (null = No evaluable). */
  valorAnterior: string | null;
};

export type PaginaMediciones = {
  items: Medicion[];
  siguienteCursor: string | null;
};

export type HistorialCorrecciones = {
  /** Correcciones (revisión ≥ 2) por número descendente. */
  items: CorreccionMedicion[];
  /** Captura original (revisión 1). */
  original: RevisionMedicion;
  /** Número de revisión desde el que continuar. */
  siguienteCursor: number | null;
};
