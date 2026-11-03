# Catálogo de actividades SQA v1

**Estado: APROBADO y ratificado por el responsable del proyecto el 2026-10-30**, [DEC-25](../decisiones/registro.md#cierre-funcional--2026-10-30). Base histórica: [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). La aprobación del producto no presume ratificación académica independiente.

Cada tipo tiene nombre, etapa fija, objetivo, descripción y evidencia sugerida. Las diez actividades A-01…A-10 aparecen preseleccionadas y son desmarcables en CU-01; solo las seleccionadas generan instancias Pendiente. Todas se pueden agregar posteriormente, incluidas instancias repetidas del mismo tipo para diferentes ejecuciones o entregables.

Cada entrega requiere resultado en texto y al menos un PDF o enlace. Los formatos sugeridos orientan la revisión; no obligan a entregar una clase concreta de archivo. No se exige simultáneamente PDF y enlace, ni integración automática con GitHub u otra herramienta. QA evalúa el contenido; el sistema solo comprueba integridad y permisos. «Hallazgos» pueden declararse como ninguno, si el resultado lo justifica; no se crea un módulo de defectos.

| Código | Actividad SQA | Etapa | Inicial | Objetivo | Descripción, resultado y evidencia sugerida | Criterio de aprobación QA |
|---|---|---|:---:|---|---|---|
| A-01 | Revisión de documentación de requisitos | Especificación de requerimientos | Sí | Detectar errores, omisiones y ambigüedades. | Alcance/versión revisada, hallazgos y conclusión; PDF o enlace al informe/checklist y documentos revisados. | Identifica qué se revisó; registra hallazgos o ausencia; las observaciones de la actividad están atendidas o justificadas. |
| A-02 | Trazabilidad de requerimientos | Especificación de requerimientos | Sí | Relacionar requisitos con artefactos y detectar huecos. | Relaciones documentadas entre requisitos y sus fuentes; PDF o enlace a la matriz. | Requisitos del alcance identificados y relaciones/huecos visibles, sin afirmar trazabilidad inexistente. |
| A-03 | Revisión de documentación de diseño | Diseño del software | Sí | Comprobar coherencia, completitud y correspondencia con requisitos. | Versión de diseño, revisión de coherencia con requisitos y hallazgos; PDF o enlace a lista de revisión, acta o informe y diseño. | Se identifican decisiones revisadas y observaciones; la evidencia permite verificar la conclusión. |
| A-04 | Trazabilidad de diseño | Diseño del software | Sí | Relacionar requisitos con elementos de diseño. | Relación entre requisitos y elementos de diseño; PDF o enlace a matriz/documento. | Elementos y requisitos del alcance están referenciados; ausencias se declaran. |
| A-05 | Análisis estático automático de código | Desarrollo | Sí | Detectar problemas mediante herramientas automáticas. | Herramienta, versión/commit, alcance, resultados y tratamiento; PDF o enlace a reporte de ESLint u otra herramienta y su ejecución. | La ejecución y su alcance son verificables y el tratamiento de hallazgos está explicado. No se impone un umbral nuevo de hallazgos. |
| A-06 | Revisión por pares (Code Review) | Desarrollo | Sí | Revisar cambios antes de integrarlos. | Cambios revisados, revisor y conclusión; PDF o enlace a PR/registro de revisión. | La revisión por otra persona es identificable y las observaciones tienen respuesta verificable. |
| A-07 | Administración de cambios de repositorio | Desarrollo | Sí | Controlar y dar trazabilidad a modificaciones. | Cambios o periodo examinado y seguimiento de versiones; PDF o enlace a commits/PR/registro. | Se pueden identificar los cambios y su integración; no se obliga a una política de ramas nueva ni a una API GitHub. |
| A-08 | Revisión personal de código | Desarrollo | Sí | Revisar el código propio antes de solicitar integración. | Código/commit revisado, checklist y hallazgos; PDF o enlace al registro. | Alcance y conclusión identificables; no se presenta como revisión por pares. |
| A-09 | Realizar pruebas (Testing) | Desarrollo | Sí | Ejecutar pruebas y registrar resultados. | Casos/alcance, entorno, versión, resultados y fallos; PDF o enlace a reporte. | La ejecución es verificable y los resultados corresponden a los casos declarados; las observaciones de QA están respondidas. |
| A-10 | Trazabilidad de pruebas | Desarrollo | Sí | Relacionar requisitos, pruebas y resultados. | Relación requisitos–casos–resultados; PDF o enlace a matriz. | Se distingue prueba diseñada de ejecutada y sus resultados; los huecos se identifican. |

Solo Aprobada cuenta como actividad realizada en la [salud](reglas-globales.md#salud-aprobada). Se conserva Pendiente → En progreso → En revisión → Aprobada, o devolución a En progreso con observaciones.

Estos criterios no convierten una actividad en Aprobada automáticamente al alcanzar una métrica. La decisión sigue siendo de QA sobre una entrega En revisión, y toda devolución conserva observaciones.

La descripción del tipo resume el alcance y resultado de su fila; el alta inicial la copia en la instancia. En CU-03 QA escribe una descripción específica. Códigos estables y tipos retirados desactivados, sin eliminar registros usados.

**Trazabilidad:** CU-01/03/04; RF-02, RF-04, RF-15–25 y RF-33; RNF-01–05, RNF-07–09.
