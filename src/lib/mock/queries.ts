/**
 * Consultas de ejemplo con la misma forma que tendrán las lecturas reales
 * (contratos-v1 §2–§6). Al conectar Supabase se sustituye este archivo;
 * las pantallas no deberían cambiar.
 */
import type {
  Actividad,
  ConteoEstados,
  EstadoActividad,
  EstadoCumplimiento,
  EstadoSalud,
  EtapaCodigo,
  Medicion,
  Metrica,
  MetricaVista,
  Proyecto,
  Usuario,
} from "@/lib/domain";
import { ESTADOS_ACTIVIDAD, SALUD_SIN_ELEMENTOS } from "@/lib/domain";
import { ETAPAS, tipoMetrica } from "@/lib/catalogs";
import { ACTIVIDADES, METRICAS, PROYECTOS, USUARIOS } from "@/lib/mock/data";

export function usuario(id: string): Usuario | undefined {
  return USUARIOS.find((u) => u.id === id);
}

export function nombreUsuario(id: string): string {
  return usuario(id)?.nombre ?? "Usuario";
}

export function miembrosElegibles(): Usuario[] {
  return USUARIOS.filter((u) => u.rol === "Miembro");
}

/** Proyectos en los que participa el usuario (abiertos y cerrados). */
export function listarProyectos(usuarioId: string): Proyecto[] {
  return PROYECTOS.filter((p) => p.participantes.some((x) => x.usuarioId === usuarioId));
}

/** null = NO_DISPONIBLE (inexistente o sin acceso; mismo trato). */
export function consultarProyecto(proyectoId: string, usuarioId: string): Proyecto | null {
  const p = PROYECTOS.find((x) => x.id === proyectoId);
  if (!p || !p.participantes.some((x) => x.usuarioId === usuarioId)) return null;
  return p;
}

export function listarActividades(proyectoId: string): Actividad[] {
  return ACTIVIDADES.filter((a) => a.proyectoId === proyectoId);
}

export function misActividades(usuarioId: string): (Actividad & { proyectoNombre: string })[] {
  return ACTIVIDADES.filter((a) => a.responsable?.usuarioId === usuarioId).map((a) => ({
    ...a,
    proyectoNombre: PROYECTOS.find((p) => p.id === a.proyectoId)!.nombre,
  }));
}

export function consultarActividad(actividadId: string): Actividad | undefined {
  return ACTIVIDADES.find((a) => a.id === actividadId);
}

export function contarEstados(actividades: Pick<Actividad, "estado">[]): ConteoEstados {
  const conteo = Object.fromEntries(ESTADOS_ACTIVIDAD.map((e) => [e, 0])) as ConteoEstados;
  for (const a of actividades) conteo[a.estado]++;
  return conteo;
}

// ---------------------------------------------------------------------------
// Métricas: evaluación según catálogo v1 (comparación por multiplicación cruzada).

function revisionActual(m: Medicion) {
  return m.revisiones[m.revisiones.length - 1]!;
}

function evaluar(metrica: Metrica, vigente: Medicion | null): EstadoCumplimiento {
  if (!vigente) return "Sin medición";
  const tipo = tipoMetrica(metrica.tipoId);
  const d = revisionActual(vigente).datosFuente;
  const obj = Number(metrica.objetivo);
  switch (tipo.codigo) {
    case "M-01": {
      if (d.ejecutadas === 0 || d.criticas_ejecutadas === 0) return "No evaluable";
      const general = 100 * d.aprobadas! >= obj * d.ejecutadas!;
      const critico = 100 * d.criticas_aprobadas! >= Number(metrica.objetivoCritico) * d.criticas_ejecutadas!;
      return general && critico ? "Cumple" : "Incumple";
    }
    case "M-02":
      if (d.integrados === 0) return "No evaluable";
      return 100 * d.integrados_revisados! >= obj * d.integrados! ? "Cumple" : "Incumple";
    case "M-03":
      if (d.requisitos_definidos === 0) return "No evaluable";
      return 100 * d.requisitos_probados! >= obj * d.requisitos_definidos! ? "Cumple" : "Incumple";
    case "M-04":
      return d.criticos_abiertos! + d.altos_abiertos! <= obj ? "Cumple" : "Incumple";
    default:
      return "No evaluable";
  }
}

export function vistaMetrica(metrica: Metrica): MetricaVista {
  const vigente = metrica.mediciones[0] ?? null;
  const rev = vigente ? revisionActual(vigente) : null;
  return {
    ...metrica,
    tipo: tipoMetrica(metrica.tipoId),
    valorActual: rev?.valor ?? null,
    valorCritico: rev?.valorCritico ?? null,
    cumplimiento: evaluar(metrica, vigente),
    medicionVigente: vigente,
  };
}

export function listarMetricas(proyectoId: string): MetricaVista[] {
  return METRICAS.filter((m) => m.proyectoId === proyectoId)
    .map(vistaMetrica)
    .sort((a, b) => a.tipo.codigo.localeCompare(b.tipo.codigo));
}

export function contarCumplimiento(metricas: MetricaVista[]): Record<EstadoCumplimiento, number> {
  const conteo: Record<EstadoCumplimiento, number> = {
    Cumple: 0,
    Incumple: 0,
    "No evaluable": 0,
    "Sin medición": 0,
  };
  for (const m of metricas) conteo[m.cumplimiento]++;
  return conteo;
}

// ---------------------------------------------------------------------------
// Resumen compartido por salud (CU-05) y reporte (CU-06): mismas cifras.

export type ResumenEtapa = {
  codigo: EtapaCodigo;
  nombre: string;
  conteos: ConteoEstados;
  actividades: { id: string; tipoCodigo: string; tipoNombre: string; descripcion: string; responsableNombre: string | null; estado: EstadoActividad }[];
  metricas: MetricaVista[];
  salud: EstadoSalud;
};

export type Resumen = {
  proyecto: Proyecto;
  generadoEn: string;
  conteos: ConteoEstados;
  etapas: ResumenEtapa[];
  metricas: MetricaVista[];
  salud: EstadoSalud;
};

export function consultarResumen(proyecto: Proyecto): Resumen {
  const actividades = listarActividades(proyecto.id);
  const metricas = listarMetricas(proyecto.id);
  return {
    proyecto,
    generadoEn: "2026-10-05T21:14:00Z",
    conteos: contarEstados(actividades),
    metricas,
    salud: SALUD_SIN_ELEMENTOS,
    etapas: ETAPAS.map((etapa) => {
      const deEtapa = actividades.filter((a) => a.tipo.etapaCodigo === etapa.codigo);
      return {
        codigo: etapa.codigo,
        nombre: etapa.nombre,
        conteos: contarEstados(deEtapa),
        actividades: deEtapa.map((a) => ({
          id: a.id,
          tipoCodigo: a.tipo.codigo,
          tipoNombre: a.tipo.nombre,
          descripcion: a.descripcion,
          responsableNombre: a.responsable?.nombre ?? null,
          estado: a.estado,
        })),
        metricas: metricas.filter((m) => m.tipo.etapaCodigo === etapa.codigo),
        salud: SALUD_SIN_ELEMENTOS,
      };
    }),
  };
}
