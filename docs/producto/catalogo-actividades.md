# Catálogo de actividades SQA v1

**Estado: APROBADO para esta versión, 2026-10-18.** [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). La aprobación del producto no presume ratificación académica independiente.

Cada tipo tiene etapa fija. «Inicial» significa preseleccionada y desmarcable en CU-01; las otras siguen disponibles. Todas se pueden agregar posteriormente, incluidas instancias repetidas del mismo tipo.

Cada entrega requiere resultado en texto y al menos un PDF o enlace con la evidencia indicada. No se exige simultáneamente PDF y enlace, ni integración automática con GitHub u otra herramienta. QA evalúa el contenido; el sistema solo comprueba integridad y permisos. «Hallazgos» pueden declararse como ninguno, si el resultado lo justifica; no se crea un módulo de defectos.

| Código | Actividad SQA | Etapa | Inicial | Resultado y evidencia admisible | Criterio de aprobación QA |
|---|---|---|:---:|---|---|
| A-01 | Revisión de la documentación de requisitos | Especificación de requerimientos | Sí | Alcance/versión revisada, hallazgos y conclusión; PDF o enlace al informe/checklist y documentos revisados. | Identifica qué se revisó; registra hallazgos o ausencia; las observaciones de la actividad están atendidas o justificadas. |
| A-02 | Realizar trazabilidad de requerimientos | Especificación de requerimientos | No | Relaciones documentadas entre requisitos y sus fuentes; PDF o enlace a la matriz. | Requisitos del alcance identificados y relaciones/huecos visibles, sin afirmar trazabilidad inexistente. |
| A-03 | Revisión de la documentación de diseño | Diseño del software | Sí | Versión de diseño, revisión de coherencia con requisitos y hallazgos; PDF o enlace al informe y diseño. | Se identifican decisiones revisadas y observaciones; la evidencia permite verificar la conclusión. |
| A-04 | Realizar trazabilidad de diseño | Diseño del software | No | Relación entre requisitos y elementos de diseño; PDF o enlace a matriz/documento. | Elementos y requisitos del alcance están referenciados; ausencias se declaran. |
| A-05 | Análisis de código estático automático | Desarrollo | Sí | Herramienta, versión/commit, alcance, resultados y tratamiento; PDF o enlace a ejecución/informe. | La ejecución y su alcance son verificables y el tratamiento de hallazgos está explicado. No se impone un umbral nuevo de hallazgos. |
| A-06 | Revisión por pares (Code Review) | Desarrollo | Sí | Cambios revisados, revisor y conclusión; PDF o enlace a PR/registro de revisión. | La revisión por otra persona es identificable y las observaciones tienen respuesta verificable. |
| A-07 | Administración de cambios de repositorio (GitHub) | Desarrollo | No | Cambios o periodo examinado y seguimiento de versiones; PDF o enlace a commits/PR/registro. | Se pueden identificar los cambios y su integración; no se obliga a una política de ramas nueva ni a una API GitHub. |
| A-08 | Revisión personal de código | Desarrollo | No | Código/commit revisado, checklist y hallazgos; PDF o enlace al registro. | Alcance y conclusión identificables; no se presenta como revisión por pares. |
| A-09 | Realizar pruebas (Testing) | Desarrollo | Sí | Casos/alcance, entorno, versión, resultados y fallos; PDF o enlace a reporte. | La ejecución es verificable y los resultados corresponden a los casos declarados; las observaciones de QA están respondidas. |
| A-10 | Realizar trazabilidad de pruebas | Desarrollo | No | Relación requisitos–casos–resultados; PDF o enlace a matriz. | Se distingue prueba diseñada de ejecutada y sus resultados; los huecos se identifican. |

Estos criterios no convierten una actividad en Aprobada automáticamente al alcanzar una métrica. La decisión sigue siendo de QA sobre una entrega En revisión, y toda devolución conserva observaciones.

La descripción del tipo resume el alcance y resultado de su fila; el alta inicial la copia en la instancia. En CU-03 QA escribe una descripción específica. Códigos estables y tipos retirados desactivados, sin eliminar registros usados.

**Trazabilidad:** CU-01/03/04; RF-02, RF-04, RF-15–25 y RF-33; RNF-01–05, RNF-07–09.
