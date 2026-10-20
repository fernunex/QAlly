/**
 * Tipos de dominio del lado de la interfaz.
 * Reflejan los DTO de lectura de docs/arquitectura/contratos-v1.md (§2 y §6).
 * Proyectos se adaptan desde Supabase; los tipos de módulos posteriores conservan sus ejemplos en src/lib/mock.
 */

export type Rol = "QA" | "Miembro";

export const ROL_ETIQUETA: Record<Rol, string> = {
  QA: "QA",
  Miembro: "Miembro del equipo",
};

export type EtapaCodigo = "requisitos" | "diseno" | "desarrollo";

export type EstadoActividad = "Pendiente" | "En progreso" | "En revisión" | "Aprobada";

export const ESTADOS_ACTIVIDAD: readonly EstadoActividad[] = [
  "Pendiente",
  "En progreso",
  "En revisión",
  "Aprobada",
];

/** Estado de cumplimiento mostrado en UI. «Sin medición» ≠ 0 y no es cumplimiento. */
export type EstadoCumplimiento = "Cumple" | "Incumple" | "No evaluable" | "Sin medición";

/** Salud: algoritmo y clasificación PENDIENTES. Solo existe «Sin evaluar». */
export type EstadoSalud = { estado: "Sin evaluar"; motivo: "Algoritmo pendiente" };

export const SALUD_SIN_EVALUAR: EstadoSalud = {
  estado: "Sin evaluar",
  motivo: "Algoritmo pendiente",
};

export type Usuario = {
  id: string;
  nombre: string;
  /** Nombre corto para avatares e historiales. */
  nombreCorto: string;
  correo: string;
  rol: Rol;
};

export type Participante = { usuarioId: string; nombre: string; rol: Rol };

export type Proyecto = {
  id: string;
  nombre: string;
  descripcion: string;
  periodoAcademico: string | null;
  /** AAAA-MM-DD */
  fechaInicio: string;
  fechaFinPrevista: string | null;
  creadoEn: string;
  actualizadoEn: string;
  cerradoEn: string | null;
  version: string;
  participantes: Participante[];
};

export type TipoActividad = {
  id: string;
  codigo: string;
  nombre: string;
  etapaCodigo: EtapaCodigo;
  inicial: boolean;
  evidencia: string;
  criterio: string;
};

export type Evidencia =
  | { id: string; tipo: "pdf"; nombreArchivo: string; tamanoBytes: number }
  | { id: string; tipo: "enlace"; url: string };

export type DecisionRevision = "Aprobar" | "Devolver";

export type Revision = {
  decision: DecisionRevision;
  observaciones: string | null;
  qaId: string;
  revisadaEn: string;
};

export type Entrega = {
  id: string;
  actividadId: string;
  numeroIntento: number;
  resultado: string | null;
  autorId: string;
  creadaEn: string;
  /** null = borrador en preparación */
  enviadaEn: string | null;
  evidencias: Evidencia[];
  revision: Revision | null;
};

export type EventoActividad = { fecha: string; texto: string };

export type Actividad = {
  id: string;
  proyectoId: string;
  tipo: Pick<TipoActividad, "id" | "codigo" | "nombre" | "etapaCodigo">;
  descripcion: string;
  responsable: { usuarioId: string; nombre: string } | null;
  estado: EstadoActividad;
  version: string;
  /** Intentos ordenados por número descendente. */
  entregas: Entrega[];
  eventos: EventoActividad[];
};

/** Fila del tablero (CU-03): sin intentos completos; el detalle se consulta aparte. */
export type ActividadResumen = Omit<Actividad, "entregas" | "eventos"> & {
  /** Último intento enviado y su decisión, si existe. */
  ultimoEnvio: {
    numeroIntento: number;
    enviadaEn: string;
    decision: DecisionRevision | null;
    revisadaEn: string | null;
  } | null;
};

export type Comparador = "≥" | "≤";

export type TipoMetrica = {
  id: string;
  codigo: string;
  nombre: string;
  etapaCodigo: EtapaCodigo;
  unidad: "%" | "defectos";
  formula: string;
  comparador: Comparador;
  objetivoInicial: string;
  objetivoCriticoInicial: string | null;
  campos: { clave: string; etiqueta: string }[];
};

export type RevisionMedicion = {
  numero: number;
  datosFuente: Record<string, number>;
  fuenteReferencia: string;
  valor: string | null;
  valorCritico?: string | null;
  autorId: string;
  registradaEn: string;
};

export type Medicion = {
  id: string;
  metricaProyectoId: string;
  /** AAAA-MM-DD */
  medidaEn: string;
  ordenRegistro: number;
  /** Revisiones por número ascendente; la última es la actual. */
  revisiones: RevisionMedicion[];
};

export type Metrica = {
  id: string;
  proyectoId: string;
  tipoId: string;
  objetivo: string;
  objetivoCritico: string | null;
  configuradaEn: string;
  /** Historial ordenado por medidaEn DESC, ordenRegistro DESC. */
  mediciones: Medicion[];
};

/** Vista derivada de una métrica, lista para pintar. */
export type MetricaVista = Metrica & {
  tipo: TipoMetrica;
  valorActual: string | null;
  valorCritico: string | null;
  cumplimiento: EstadoCumplimiento;
  medicionVigente: Medicion | null;
};

export type ConteoEstados = Record<EstadoActividad, number>;
