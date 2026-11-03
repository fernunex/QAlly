import type { AdvertenciaSalud, ClasificacionSalud } from "@/lib/domain";

/**
 * Construye el JSON de salud tal como lo devuelve `private.salud_json` (ADR-003). Solo para
 * fixtures de la interfaz: el cálculo real se prueba contra la BD en tests/database.
 */
export function saludJson(
  o: {
    na?: number;
    aa?: number;
    nm?: number;
    sinDatos?: number;
    porcentaje?: string;
    clasificacion?: ClasificacionSalud;
    puntos?: string;
    advertencias?: AdvertenciaSalud[];
  } = {},
) {
  const na = o.na ?? 0;
  const nm = o.nm ?? 0;
  const vacio = na + nm === 0;
  return {
    estado: vacio ? "Sin evaluar" : "Evaluada",
    porcentaje: vacio ? null : (o.porcentaje ?? "0.00"),
    clasificacion: vacio ? null : (o.clasificacion ?? "Malo"),
    puntos: o.puntos ?? "0",
    posibles: na + nm,
    actividades: { total: na, aprobadas: o.aa ?? 0 },
    metricas: { total: nm, sinDatos: o.sinDatos ?? 0 },
    advertencias: o.advertencias ?? (vacio ? ["SIN_ELEMENTOS"] : []),
  };
}
