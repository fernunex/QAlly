/**
 * DATOS DE EJEMPLO — solo para construir la interfaz.
 * Se reemplazan por consultas Supabase (RLS) al conectar la funcionalidad.
 * Reproducen el escenario de los mockups UI/UX v0.2.
 */
import type {
  Actividad,
  Entrega,
  EstadoActividad,
  EtapaCodigo,
  Metrica,
  Proyecto,
  Usuario,
} from "@/lib/domain";
import { TIPOS_ACTIVIDAD } from "@/lib/catalogs";

export const USUARIOS: Usuario[] = [
  { id: "u-david", nombre: "David S.", nombreCorto: "David S.", correo: "david@equipo.dev", rol: "QA" },
  { id: "u-emi", nombre: "Emi", nombreCorto: "Emi", correo: "emi@equipo.dev", rol: "Miembro" },
  { id: "u-josuu", nombre: "Josuu", nombreCorto: "Josuu", correo: "josuu@equipo.dev", rol: "Miembro" },
  { id: "u-fer", nombre: "Fer", nombreCorto: "Fer", correo: "fer@equipo.dev", rol: "Miembro" },
  { id: "u-daniela", nombre: "Daniela", nombreCorto: "Daniela", correo: "daniela@equipo.dev", rol: "Miembro" },
  { id: "u-ana", nombre: "Ana P.", nombreCorto: "Ana P.", correo: "ana@equipo.dev", rol: "Miembro" },
];

function participantes(...ids: string[]) {
  return ids.map((id) => {
    const u = USUARIOS.find((x) => x.id === id)!;
    return { usuarioId: u.id, nombre: u.nombre, rol: u.rol };
  });
}

export const PROYECTOS: Proyecto[] = [
  {
    id: "p-qally",
    nombre: "QAlly",
    descripcion: "Plataforma de monitoreo SQA",
    periodoAcademico: "Ago–Dic 2026",
    fechaInicio: "2026-09-01",
    fechaFinPrevista: "2026-12-12",
    creadoEn: "2026-09-01T15:00:00Z",
    actualizadoEn: "2026-10-03T17:20:00Z",
    cerradoEn: null,
    version: "7",
    participantes: participantes("u-david", "u-emi", "u-josuu", "u-fer", "u-daniela"),
  },
  {
    id: "p-servicio",
    nombre: "Portal Servicio Social",
    descripcion: "Registro y seguimiento de horas",
    periodoAcademico: "Ago–Dic 2026",
    fechaInicio: "2026-08-18",
    fechaFinPrevista: "2026-11-28",
    creadoEn: "2026-08-18T15:00:00Z",
    actualizadoEn: "2026-10-02T15:00:00Z",
    cerradoEn: null,
    version: "4",
    participantes: participantes("u-david", "u-emi", "u-fer", "u-ana"),
  },
  {
    id: "p-siga",
    nombre: "SIGA Inventarios",
    descripcion: "Control de almacén",
    periodoAcademico: "Ago–Dic 2026",
    fechaInicio: "2026-08-25",
    fechaFinPrevista: "2026-12-05",
    creadoEn: "2026-08-25T15:00:00Z",
    actualizadoEn: "2026-09-30T15:00:00Z",
    cerradoEn: null,
    version: "3",
    participantes: participantes("u-david", "u-emi", "u-josuu"),
  },
  {
    id: "p-tutorias",
    nombre: "Sistema de Tutorías",
    descripcion: "Agenda de asesorías",
    periodoAcademico: "Ene–Jun 2026",
    fechaInicio: "2026-01-12",
    fechaFinPrevista: "2026-06-19",
    creadoEn: "2026-01-12T15:00:00Z",
    actualizadoEn: "2026-06-19T20:00:00Z",
    cerradoEn: "2026-06-19T20:00:00Z",
    version: "12",
    participantes: participantes("u-david", "u-fer", "u-daniela"),
  },
];

// ---------------------------------------------------------------------------
// Actividades SQA

type Semilla = {
  id: string;
  proyectoId: string;
  tipo: string;
  descripcion: string;
  responsable: string | null;
  estado: EstadoActividad;
  entregas?: Entrega[];
  eventos?: { fecha: string; texto: string }[];
};

function nombreDe(id: string) {
  return USUARIOS.find((u) => u.id === id)!.nombre;
}

function aprobada(actividadId: string, autor: string, fecha: string, resultado: string, archivo: string): Entrega[] {
  return [
    {
      id: `${actividadId}-e1`,
      actividadId,
      numeroIntento: 1,
      resultado,
      autorId: autor,
      creadaEn: fecha,
      enviadaEn: fecha,
      evidencias: [{ id: `${actividadId}-ev1`, tipo: "pdf", nombreArchivo: archivo, tamanoBytes: 410_000 }],
      revision: { decision: "Aprobar", observaciones: null, qaId: "u-david", revisadaEn: fecha },
    },
  ];
}

function enviada(actividadId: string, autor: string, fecha: string, resultado: string, archivo: string): Entrega[] {
  return [
    {
      id: `${actividadId}-e1`,
      actividadId,
      numeroIntento: 1,
      resultado,
      autorId: autor,
      creadaEn: fecha,
      enviadaEn: fecha,
      evidencias: [{ id: `${actividadId}-ev1`, tipo: "pdf", nombreArchivo: archivo, tamanoBytes: 1_258_291 }],
      revision: null,
    },
  ];
}

const SEMILLAS: Semilla[] = [
  // ---- QAlly: 12 actividades (2 Pendiente, 3 En progreso, 3 En revisión, 4 Aprobada)
  {
    id: "a-q-sds-datos",
    proyectoId: "p-qally",
    tipo: "A-03",
    descripcion: "Revisión del SDS — arquitectura de datos",
    responsable: "u-emi",
    estado: "Pendiente",
    eventos: [
      { fecha: "2026-10-02T16:00:00Z", texto: "David S. (QA) asignó la actividad a Emi" },
      { fecha: "2026-10-02T15:58:00Z", texto: "David S. (QA) agregó la actividad" },
    ],
  },
  {
    id: "a-q-pruebas-reportes",
    proyectoId: "p-qally",
    tipo: "A-09",
    descripcion: "Pruebas unitarias del módulo de reportes",
    responsable: null,
    estado: "Pendiente",
    eventos: [{ fecha: "2026-10-04T15:00:00Z", texto: "David S. (QA) agregó la actividad" }],
  },
  {
    id: "a-q-matriz-v2",
    proyectoId: "p-qally",
    tipo: "A-02",
    descripcion: "Matriz de trazabilidad requisitos → diseño v2",
    responsable: "u-daniela",
    estado: "En progreso",
  },
  {
    id: "a-q-sds-interfaces",
    proyectoId: "p-qally",
    tipo: "A-03",
    descripcion: "Revisión del SDS — diseño de interfaces",
    responsable: "u-fer",
    estado: "En progreso",
  },
  {
    id: "a-q-eslint",
    proyectoId: "p-qally",
    tipo: "A-05",
    descripcion: "Configurar ESLint y reglas del equipo",
    responsable: "u-emi",
    estado: "En progreso",
    entregas: [
      {
        id: "a-q-eslint-e2",
        actividadId: "a-q-eslint",
        numeroIntento: 2,
        resultado:
          "Se agregó el archivo de reglas del equipo y se corrigieron las 6 advertencias reportadas por el análisis.",
        autorId: "u-emi",
        creadaEn: "2026-10-01T17:00:00Z",
        enviadaEn: null,
        evidencias: [
          {
            id: "a-q-eslint-ev2",
            tipo: "enlace",
            url: "https://github.com/equipo/qally/blob/main/.eslintrc.json",
          },
        ],
        revision: null,
      },
      {
        id: "a-q-eslint-e1",
        actividadId: "a-q-eslint",
        numeroIntento: 1,
        resultado: "ESLint instalado con la configuración base y el script de análisis en el repositorio.",
        autorId: "u-emi",
        creadaEn: "2026-09-27T18:00:00Z",
        enviadaEn: "2026-09-28T18:00:00Z",
        evidencias: [{ id: "a-q-eslint-ev1", tipo: "pdf", nombreArchivo: "eslint-reporte-v1.pdf", tamanoBytes: 245_760 }],
        revision: {
          decision: "Devolver",
          observaciones:
            "La evidencia no incluye las reglas del equipo. Adjunta el archivo de configuración o su enlace.",
          qaId: "u-david",
          revisadaEn: "2026-09-30T16:42:00Z",
        },
      },
    ],
    eventos: [
      { fecha: "2026-09-30T16:42:00Z", texto: "David S. (QA) devolvió con observaciones (intento 1)" },
      { fecha: "2026-09-28T18:00:00Z", texto: "Emi envió a revisión (intento 1)" },
      { fecha: "2026-09-25T15:00:00Z", texto: "Emi inició la actividad" },
      { fecha: "2026-09-24T15:00:00Z", texto: "David S. (QA) asignó la actividad a Emi" },
    ],
  },
  {
    id: "a-q-req-reportes",
    proyectoId: "p-qally",
    tipo: "A-01",
    descripcion: "Revisión de requisitos del módulo de reportes",
    responsable: "u-josuu",
    estado: "En revisión",
    entregas: enviada(
      "a-q-req-reportes",
      "u-josuu",
      "2026-10-03T17:00:00Z",
      "Se revisó la sección 4 del SRS v1.2. Tres hallazgos menores de redacción; sin ambigüedades funcionales.",
      "revision-req-reportes.pdf",
    ),
  },
  {
    id: "a-q-pr42",
    proyectoId: "p-qally",
    tipo: "A-06",
    descripcion: "Revisar PR #42 — cálculo de métricas",
    responsable: "u-fer",
    estado: "En revisión",
    entregas: [
      {
        id: "a-q-pr42-e1",
        actividadId: "a-q-pr42",
        numeroIntento: 1,
        resultado: "PR revisado por Fer; dos comentarios resueltos antes de integrar.",
        autorId: "u-fer",
        creadaEn: "2026-10-04T15:00:00Z",
        enviadaEn: "2026-10-04T15:00:00Z",
        evidencias: [{ id: "a-q-pr42-ev1", tipo: "enlace", url: "https://github.com/equipo/qally/pull/42" }],
        revision: null,
      },
    ],
  },
  {
    id: "a-q-login",
    proyectoId: "p-qally",
    tipo: "A-09",
    descripcion: "Ejecutar casos de prueba — Login",
    responsable: "u-josuu",
    estado: "En revisión",
    entregas: enviada(
      "a-q-login",
      "u-josuu",
      "2026-10-04T18:00:00Z",
      "20 casos ejecutados, 18 aprobados. Fallan CP-07 (bloqueo tras 5 intentos) y CP-11 (mensaje de error).",
      "ejecucion-casos-login.pdf",
    ),
    eventos: [
      { fecha: "2026-10-04T18:00:00Z", texto: "Josuu envió a revisión (intento 1)" },
      { fecha: "2026-10-02T15:00:00Z", texto: "Josuu inició la actividad" },
      { fecha: "2026-10-01T16:00:00Z", texto: "David S. (QA) asignó la actividad a Josuu" },
      { fecha: "2026-10-01T15:50:00Z", texto: "David S. (QA) agregó la actividad" },
    ],
  },
  {
    id: "a-q-srs",
    proyectoId: "p-qally",
    tipo: "A-01",
    descripcion: "Revisión del SRS v1.0",
    responsable: "u-daniela",
    estado: "Aprobada",
    entregas: aprobada("a-q-srs", "u-daniela", "2026-09-30T15:00:00Z", "Revisión completa del SRS v1.0.", "revision-srs-v1.pdf"),
  },
  {
    id: "a-q-traz-acceso",
    proyectoId: "p-qally",
    tipo: "A-02",
    descripcion: "Trazabilidad de requisitos del módulo de acceso",
    responsable: "u-fer",
    estado: "Aprobada",
    entregas: aprobada("a-q-traz-acceso", "u-fer", "2026-09-28T15:00:00Z", "Matriz de acceso completa.", "matriz-acceso.pdf"),
  },
  {
    id: "a-q-traz-diseno",
    proyectoId: "p-qally",
    tipo: "A-04",
    descripcion: "Trazabilidad diseño → requisitos v1",
    responsable: "u-daniela",
    estado: "Aprobada",
    entregas: aprobada("a-q-traz-diseno", "u-daniela", "2026-09-26T15:00:00Z", "Matriz diseño–requisitos v1.", "traz-diseno-v1.pdf"),
  },
  {
    id: "a-q-personal-auth",
    proyectoId: "p-qally",
    tipo: "A-08",
    descripcion: "Revisión personal del módulo de autenticación",
    responsable: "u-josuu",
    estado: "Aprobada",
    entregas: aprobada("a-q-personal-auth", "u-josuu", "2026-09-24T15:00:00Z", "Checklist personal aplicado.", "checklist-auth.pdf"),
  },

  // ---- Portal Servicio Social
  {
    id: "a-s-pares-horas",
    proyectoId: "p-servicio",
    tipo: "A-06",
    descripcion: "Revisión por pares del módulo de registro de horas",
    responsable: "u-emi",
    estado: "En revisión",
    entregas: enviada(
      "a-s-pares-horas",
      "u-emi",
      "2026-10-02T17:00:00Z",
      "Revisión del PR #18; observaciones atendidas por el autor.",
      "revision-pares-horas.pdf",
    ),
  },
  {
    id: "a-s-personal-registro",
    proyectoId: "p-servicio",
    tipo: "A-08",
    descripcion: "Revisión personal del módulo de registro",
    responsable: "u-emi",
    estado: "Aprobada",
    entregas: aprobada("a-s-personal-registro", "u-emi", "2026-09-28T15:00:00Z", "Checklist aplicado.", "personal-registro.pdf"),
  },
  { id: "a-s-1", proyectoId: "p-servicio", tipo: "A-01", descripcion: "Revisión del SRS del portal", responsable: "u-ana", estado: "Aprobada" },
  { id: "a-s-2", proyectoId: "p-servicio", tipo: "A-03", descripcion: "Revisión del diseño de base de datos", responsable: "u-fer", estado: "Aprobada" },
  { id: "a-s-3", proyectoId: "p-servicio", tipo: "A-05", descripcion: "Análisis estático inicial", responsable: "u-fer", estado: "Aprobada" },
  { id: "a-s-4", proyectoId: "p-servicio", tipo: "A-09", descripcion: "Pruebas del registro de horas", responsable: "u-ana", estado: "En progreso" },
  { id: "a-s-5", proyectoId: "p-servicio", tipo: "A-02", descripcion: "Matriz de trazabilidad v1", responsable: "u-ana", estado: "En progreso" },
  { id: "a-s-6", proyectoId: "p-servicio", tipo: "A-04", descripcion: "Trazabilidad de diseño v1", responsable: null, estado: "Pendiente" },
  { id: "a-s-7", proyectoId: "p-servicio", tipo: "A-10", descripcion: "Trazabilidad de pruebas", responsable: null, estado: "Pendiente" },

  // ---- SIGA Inventarios
  {
    id: "a-g-unitarias",
    proyectoId: "p-siga",
    tipo: "A-09",
    descripcion: "Pruebas unitarias del servicio de inventario",
    responsable: "u-emi",
    estado: "Pendiente",
  },
  { id: "a-g-1", proyectoId: "p-siga", tipo: "A-01", descripcion: "Revisión del SRS", responsable: "u-josuu", estado: "Aprobada" },
  { id: "a-g-2", proyectoId: "p-siga", tipo: "A-03", descripcion: "Revisión del diseño", responsable: "u-josuu", estado: "Aprobada" },
  { id: "a-g-3", proyectoId: "p-siga", tipo: "A-05", descripcion: "Análisis estático", responsable: "u-emi", estado: "En progreso" },
  { id: "a-g-4", proyectoId: "p-siga", tipo: "A-06", descripcion: "Revisión de PR de entradas", responsable: null, estado: "Pendiente" },
  { id: "a-g-5", proyectoId: "p-siga", tipo: "A-02", descripcion: "Matriz de trazabilidad", responsable: null, estado: "Pendiente" },

  // ---- Sistema de Tutorías (cerrado)
  { id: "a-t-1", proyectoId: "p-tutorias", tipo: "A-01", descripcion: "Revisión del SRS", responsable: "u-fer", estado: "Aprobada" },
  { id: "a-t-2", proyectoId: "p-tutorias", tipo: "A-03", descripcion: "Revisión del SDS", responsable: "u-daniela", estado: "Aprobada" },
  { id: "a-t-3", proyectoId: "p-tutorias", tipo: "A-05", descripcion: "Análisis estático", responsable: "u-fer", estado: "Aprobada" },
  { id: "a-t-4", proyectoId: "p-tutorias", tipo: "A-06", descripcion: "Revisión por pares final", responsable: "u-daniela", estado: "Aprobada" },
  { id: "a-t-5", proyectoId: "p-tutorias", tipo: "A-09", descripcion: "Pruebas de agenda", responsable: "u-fer", estado: "En progreso" },
];

export const ACTIVIDADES: Actividad[] = SEMILLAS.map((s, i) => {
  const tipo = TIPOS_ACTIVIDAD.find((t) => t.codigo === s.tipo)!;
  return {
    id: s.id,
    proyectoId: s.proyectoId,
    tipo: { id: tipo.id, codigo: tipo.codigo, nombre: tipo.nombre, etapaCodigo: tipo.etapaCodigo as EtapaCodigo },
    descripcion: s.descripcion,
    responsable: s.responsable ? { usuarioId: s.responsable, nombre: nombreDe(s.responsable) } : null,
    estado: s.estado,
    version: String(3 + (i % 5)),
    entregas: s.entregas ?? [],
    eventos: s.eventos ?? [],
  };
});

// ---------------------------------------------------------------------------
// Métricas (solo QAlly tiene historial detallado)

export const METRICAS: Metrica[] = [
  {
    id: "m-q-01",
    proyectoId: "p-qally",
    tipoId: "tm-01",
    objetivo: "90",
    objetivoCritico: "100",
    configuradaEn: "2026-09-01T15:00:00Z",
    mediciones: [
      {
        id: "md-q01-1",
        metricaProyectoId: "m-q-01",
        medidaEn: "2026-10-03",
        ordenRegistro: 3,
        revisiones: [
          {
            numero: 1,
            datosFuente: { aprobadas: 47, ejecutadas: 50, criticas_aprobadas: 12, criticas_ejecutadas: 12 },
            fuenteReferencia: "Ejecución de regresión sprint 4",
            valor: "94.00000000",
            valorCritico: "100.00000000",
            autorId: "u-david",
            registradaEn: "2026-10-03T16:00:00Z",
          },
        ],
      },
    ],
  },
  {
    id: "m-q-02",
    proyectoId: "p-qally",
    tipoId: "tm-02",
    objetivo: "100",
    objetivoCritico: null,
    configuradaEn: "2026-09-01T15:00:00Z",
    mediciones: [
      {
        id: "md-q02-4",
        metricaProyectoId: "m-q-02",
        medidaEn: "2026-10-03",
        ordenRegistro: 4,
        revisiones: [
          {
            numero: 1,
            datosFuente: { integrados_revisados: 13, integrados: 18 },
            fuenteReferencia: "https://github.com/equipo/qally/pulls",
            valor: "72.22222222",
            autorId: "u-david",
            registradaEn: "2026-10-03T16:10:00Z",
          },
        ],
      },
      {
        id: "md-q02-3",
        metricaProyectoId: "m-q-02",
        medidaEn: "2026-09-26",
        ordenRegistro: 3,
        revisiones: [
          {
            numero: 1,
            datosFuente: { integrados_revisados: 18, integrados: 25 },
            fuenteReferencia: "Sprint 3",
            valor: "72.00000000",
            autorId: "u-david",
            registradaEn: "2026-09-26T16:00:00Z",
          },
          {
            numero: 2,
            datosFuente: { integrados_revisados: 19, integrados: 25 },
            fuenteReferencia: "Sprint 3",
            valor: "76.00000000",
            autorId: "u-david",
            registradaEn: "2026-09-29T16:05:00Z",
          },
          {
            numero: 3,
            datosFuente: { integrados_revisados: 20, integrados: 25 },
            fuenteReferencia: "Sprint 3",
            valor: "80.00000000",
            autorId: "u-david",
            registradaEn: "2026-10-03T11:20:00Z",
          },
        ],
      },
      {
        id: "md-q02-2",
        metricaProyectoId: "m-q-02",
        medidaEn: "2026-09-19",
        ordenRegistro: 2,
        revisiones: [
          {
            numero: 1,
            datosFuente: { integrados_revisados: 17, integrados: 21 },
            fuenteReferencia: "Reporte semanal",
            valor: "80.95238095",
            autorId: "u-david",
            registradaEn: "2026-09-19T16:00:00Z",
          },
        ],
      },
      {
        id: "md-q02-1",
        metricaProyectoId: "m-q-02",
        medidaEn: "2026-09-12",
        ordenRegistro: 1,
        revisiones: [
          {
            numero: 1,
            datosFuente: { integrados_revisados: 22, integrados: 25 },
            fuenteReferencia: "Primera medición",
            valor: "88.00000000",
            autorId: "u-david",
            registradaEn: "2026-09-12T16:00:00Z",
          },
        ],
      },
    ],
  },
  {
    id: "m-q-04",
    proyectoId: "p-qally",
    tipoId: "tm-04",
    objetivo: "0",
    objetivoCritico: null,
    configuradaEn: "2026-09-01T15:00:00Z",
    mediciones: [],
  },
  {
    id: "m-s-02",
    proyectoId: "p-servicio",
    tipoId: "tm-02",
    objetivo: "100",
    objetivoCritico: null,
    configuradaEn: "2026-08-18T15:00:00Z",
    mediciones: [],
  },
];
