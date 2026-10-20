import type { ResumenProyecto } from "@/features/health/types";

/**
 * Resultado de `generarReporte` (contratos v1 §6). `resumen` es el mismo DTO de CU-05 y
 * `capturaToken` es la captura cifrada que la exportación vuelve a verificar. `emitidaEn`
 * acompaña a `venceEn` para que la vista muestre la misma fecha de generación que el PDF.
 *
 * El token solo vive en memoria de la pantalla: sin URL, logs ni localStorage.
 */
export type ReporteGenerado = {
  resumen: ResumenProyecto;
  capturaToken: string;
  /** ISO; fecha de generación del reporte, igual en vista y PDF. */
  emitidaEn: string;
  /** ISO; emitidaEn + 15 minutos. */
  venceEn: string;
};
