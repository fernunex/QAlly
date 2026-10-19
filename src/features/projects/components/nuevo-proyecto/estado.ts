import type { CatalogosProyecto } from "../../server/queries";
import type { TipoMetrica } from "@/lib/domain";
import {
  validarDatosGenerales,
  type DatosGenerales,
} from "@/features/projects/components/editar-proyecto-dialog";

export type PersonaElegible = { id: string; nombre: string };

export type ConfigMetrica = {
  activa: boolean;
  objetivo: string;
  critico: string;
};

export type EstadoAsistente = {
  general: DatosGenerales;
  /** Ids de miembros elegidos (sin incluir al QA creador, que se incorpora siempre). */
  miembros: string[];
  /** Ids de tipos de actividad elegidos. */
  actividades: string[];
  metricas: Record<string, ConfigMetrica>;
};

export type PasoId = 1 | 2 | 3 | 4;

export const PASOS: readonly { id: PasoId; titulo: string; corto: string }[] = [
  {
    id: 1,
    titulo: "Información general y miembros",
    corto: "Información general",
  },
  { id: 2, titulo: "Actividades SQA", corto: "Actividades SQA" },
  { id: 3, titulo: "Métricas", corto: "Métricas" },
  { id: 4, titulo: "Confirmación", corto: "Confirmación" },
];

export function estadoInicial(catalogos: CatalogosProyecto): EstadoAsistente {
  const { actividades: TIPOS_ACTIVIDAD, metricas: TIPOS_METRICA } = catalogos;
  return {
    general: {
      nombre: "",
      descripcion: "",
      periodoAcademico: null,
      fechaInicio: "",
      fechaFinPrevista: null,
    },
    miembros: [],
    actividades: TIPOS_ACTIVIDAD.filter((t) => t.inicial).map((t) => t.id),
    metricas: Object.fromEntries(
      TIPOS_METRICA.map((t) => [
        t.id,
        {
          activa: true,
          objetivo: t.objetivoInicial,
          critico: t.objetivoCriticoInicial ?? "",
        },
      ]),
    ),
  };
}

export function idCampoMetrica(tipoId: string, campo: "objetivo" | "critico") {
  return `metrica-${tipoId}-${campo}`;
}

function validarObjetivo(tipo: TipoMetrica, valor: string): string | null {
  const v = valor.trim();
  if (!v) return "Indica el objetivo.";
  if (tipo.unidad === "defectos") {
    return /^\d+$/.test(v) && BigInt(v) <= 2000000000n
      ? null
      : "El objetivo debe ser un entero entre 0 y 2000000000.";
  }
  if (!/^\d+(\.\d+)?$/.test(v))
    return "Escribe un número, por ejemplo 90 o 87.5.";
  if (Number(v) > 100) return "El objetivo debe estar entre 0 y 100 %.";
  if (!/^\d+(\.\d{1,4})?$/.test(v)) return "Usa hasta 4 decimales.";
  return null;
}

/** Errores por campo de métricas activas; la clave es el id del input. */
export function validarMetricas(
  metricas: EstadoAsistente["metricas"],
  tipos: readonly TipoMetrica[],
): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const tipo of tipos) {
    const cfg = metricas[tipo.id];
    if (!cfg?.activa) continue;
    const e = validarObjetivo(tipo, cfg.objetivo);
    if (e) errores[idCampoMetrica(tipo.id, "objetivo")] = e;
    if (tipo.objetivoCriticoInicial !== null) {
      const ec = validarObjetivo(tipo, cfg.critico);
      if (ec)
        errores[idCampoMetrica(tipo.id, "critico")] = ec.replace(
          "el objetivo",
          "el objetivo crítico",
        );
    }
  }
  return errores;
}

/** Número de campos inválidos por paso (a, b, c, d). */
export function erroresDelPaso(
  paso: PasoId,
  e: EstadoAsistente,
  tipos: readonly TipoMetrica[],
): number {
  if (paso === 1) return Object.keys(validarDatosGenerales(e.general)).length;
  if (paso === 3) return Object.keys(validarMetricas(e.metricas, tipos)).length;
  return 0;
}
