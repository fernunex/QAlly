import type { EtapaCodigo, TipoActividad, TipoMetrica } from "@/lib/domain";

/** Etapas fijas, en orden. docs/producto/reglas-globales.md */
export const ETAPAS: readonly { codigo: EtapaCodigo; nombre: string; orden: number }[] = [
  { codigo: "requisitos", nombre: "Especificación de requerimientos", orden: 1 },
  { codigo: "diseno", nombre: "Diseño del software", orden: 2 },
  { codigo: "desarrollo", nombre: "Desarrollo", orden: 3 },
];

export function nombreEtapa(codigo: EtapaCodigo): string {
  return ETAPAS.find((e) => e.codigo === codigo)?.nombre ?? codigo;
}

/** Catálogo de actividades SQA v1 ratificado por DEC-25: diez preseleccionadas y desmarcables. */
export const TIPOS_ACTIVIDAD: readonly TipoActividad[] = [
  {
    id: "ta-01",
    codigo: "A-01",
    nombre: "Revisión de documentación de requisitos",
    etapaCodigo: "requisitos",
    inicial: true,
    objetivo: "Detectar errores, omisiones y ambigüedades.",
    evidencia:
      "Alcance/versión revisada, hallazgos y conclusión; PDF o enlace al informe/checklist y documentos revisados.",
    criterio:
      "Identifica qué se revisó; registra hallazgos o ausencia; las observaciones están atendidas o justificadas.",
  },
  {
    id: "ta-02",
    codigo: "A-02",
    nombre: "Trazabilidad de requerimientos",
    etapaCodigo: "requisitos",
    inicial: true,
    objetivo: "Relacionar requisitos con artefactos y detectar huecos.",
    evidencia: "Relaciones documentadas entre requisitos y sus fuentes; PDF o enlace a la matriz.",
    criterio: "Requisitos del alcance identificados y relaciones/huecos visibles.",
  },
  {
    id: "ta-03",
    codigo: "A-03",
    nombre: "Revisión de documentación de diseño",
    etapaCodigo: "diseno",
    inicial: true,
    objetivo: "Comprobar coherencia, completitud y correspondencia con requisitos.",
    evidencia:
      "Versión de diseño, revisión de coherencia con requisitos y hallazgos; PDF o enlace al informe y diseño.",
    criterio: "Se identifican decisiones revisadas y observaciones; la evidencia permite verificar la conclusión.",
  },
  {
    id: "ta-04",
    codigo: "A-04",
    nombre: "Trazabilidad de diseño",
    etapaCodigo: "diseno",
    inicial: true,
    objetivo: "Relacionar requisitos con elementos de diseño.",
    evidencia: "Relación entre requisitos y elementos de diseño; PDF o enlace a matriz/documento.",
    criterio: "Elementos y requisitos del alcance están referenciados; ausencias se declaran.",
  },
  {
    id: "ta-05",
    codigo: "A-05",
    nombre: "Análisis estático automático de código",
    etapaCodigo: "desarrollo",
    inicial: true,
    objetivo: "Detectar problemas mediante herramientas automáticas.",
    evidencia:
      "Herramienta, versión/commit, alcance, resultados y tratamiento; PDF o enlace a ejecución/informe.",
    criterio: "La ejecución y su alcance son verificables y el tratamiento de hallazgos está explicado.",
  },
  {
    id: "ta-06",
    codigo: "A-06",
    nombre: "Revisión por pares (Code Review)",
    etapaCodigo: "desarrollo",
    inicial: true,
    objetivo: "Revisar cambios antes de integrarlos.",
    evidencia: "Cambios revisados, revisor y conclusión; PDF o enlace a PR/registro de revisión.",
    criterio: "La revisión por otra persona es identificable y las observaciones tienen respuesta verificable.",
  },
  {
    id: "ta-07",
    codigo: "A-07",
    nombre: "Administración de cambios de repositorio",
    etapaCodigo: "desarrollo",
    inicial: true,
    objetivo: "Controlar y dar trazabilidad a modificaciones.",
    evidencia: "Cambios o periodo examinado y seguimiento de versiones; PDF o enlace a commits/PR/registro.",
    criterio: "Se pueden identificar los cambios y su integración.",
  },
  {
    id: "ta-08",
    codigo: "A-08",
    nombre: "Revisión personal de código",
    etapaCodigo: "desarrollo",
    inicial: true,
    objetivo: "Revisar el código propio antes de solicitar integración.",
    evidencia: "Código/commit revisado, checklist y hallazgos; PDF o enlace al registro.",
    criterio: "Alcance y conclusión identificables; no se presenta como revisión por pares.",
  },
  {
    id: "ta-09",
    codigo: "A-09",
    nombre: "Realizar pruebas (Testing)",
    etapaCodigo: "desarrollo",
    inicial: true,
    objetivo: "Ejecutar pruebas y registrar resultados.",
    evidencia: "Casos/alcance, entorno, versión, resultados y fallos; PDF o enlace a reporte.",
    criterio:
      "La ejecución es verificable y los resultados corresponden a los casos declarados; las observaciones de QA están respondidas.",
  },
  {
    id: "ta-10",
    codigo: "A-10",
    nombre: "Trazabilidad de pruebas",
    etapaCodigo: "desarrollo",
    inicial: true,
    objetivo: "Relacionar requisitos, pruebas y resultados.",
    evidencia: "Relación requisitos–casos–resultados; PDF o enlace a matriz.",
    criterio: "Se distingue prueba diseñada de ejecutada y sus resultados; los huecos se identifican.",
  },
];

/** Catálogo de métricas v1 (DEC-26). Todas de Desarrollo, captura manual y fuente opcional. */
export const TIPOS_METRICA: readonly TipoMetrica[] = [
  {
    id: "tm-01",
    codigo: "M-01",
    nombre: "Tasa de pruebas aprobadas",
    etapaCodigo: "desarrollo",
    unidad: "%",
    formula: "100 × pruebas aprobadas / pruebas ejecutadas",
    comparador: "≥",
    objetivoInicial: "90",
    objetivoCriticoInicial: "100",
    campos: [
      { clave: "aprobadas", etiqueta: "Pruebas aprobadas" },
      { clave: "ejecutadas", etiqueta: "Pruebas ejecutadas" },
      { clave: "criticas_aprobadas", etiqueta: "Críticas aprobadas" },
      { clave: "criticas_ejecutadas", etiqueta: "Críticas ejecutadas" },
    ],
  },
  {
    id: "tm-02",
    codigo: "M-02",
    nombre: "Porcentaje de PR revisados",
    etapaCodigo: "desarrollo",
    unidad: "%",
    formula: "100 × PR integrados revisados / PR integrados",
    comparador: "≥",
    objetivoInicial: "100",
    objetivoCriticoInicial: null,
    campos: [
      { clave: "integrados_revisados", etiqueta: "PR integrados revisados" },
      { clave: "integrados", etiqueta: "PR integrados" },
    ],
  },
  {
    id: "tm-03",
    codigo: "M-03",
    nombre: "Cobertura de requisitos probados",
    etapaCodigo: "desarrollo",
    unidad: "%",
    formula: "100 × requisitos probados / requisitos definidos",
    comparador: "≥",
    objetivoInicial: "100",
    objetivoCriticoInicial: null,
    campos: [
      { clave: "requisitos_probados", etiqueta: "Requisitos probados" },
      { clave: "requisitos_definidos", etiqueta: "Requisitos definidos" },
    ],
  },
  {
    id: "tm-04",
    codigo: "M-04",
    nombre: "Defectos de alta severidad abiertos",
    etapaCodigo: "desarrollo",
    unidad: "defectos",
    formula: "defectos críticos abiertos + defectos altos abiertos",
    comparador: "≤",
    objetivoInicial: "0",
    objetivoCriticoInicial: null,
    campos: [
      { clave: "criticos_abiertos", etiqueta: "Críticos abiertos" },
      { clave: "altos_abiertos", etiqueta: "Altos abiertos" },
    ],
  },
];

export function tipoMetrica(id: string): TipoMetrica {
  const tipo = TIPOS_METRICA.find((t) => t.id === id);
  if (!tipo) throw new Error(`Tipo de métrica desconocido: ${id}`);
  return tipo;
}

/** Límites de evidencia aprobados (ADR-002). */
export const LIMITE_PDF_BYTES = 3 * 1024 * 1024;
export const LIMITE_URL_CARACTERES = 2048;
