# Propuesta de cierre del diseño v1, excepto salud

> **ANTECEDENTE HISTÓRICO:** propuesta aprobada el 2026-10-18. Su redacción original se conserva abajo; no es un pendiente ni la fuente operativa. Véase [ADR-002-cierre-diseno-v1.md](ADR-002-cierre-diseno-v1.md) para la decisión o especificación vigente.

**Fecha: 2026-10-18. Estado: PROPUESTO, listo para aprobación.** El usuario solicitó resolver los pendientes de diseño y mantener salud pendiente. Este documento resuelve las elecciones y presenta cambios concretos antes de incorporarlos a las fuentes aprobadas, conforme a [AGENTS.md](../../AGENTS.md). No constituye aprobación de reglas nuevas ni autorización de implementación.

## Decisiones para esta versión

| Punto | Resolución propuesta |
|---|---|
| Salud | Sigue PENDIENTE: algoritmo, pesos y clasificación. Resumen general y tres etapas disponibles, siempre Sin evaluar hasta aprobar el cálculo. |
| Actividades | Conservar los diez tipos actuales; definir códigos, preselección, resultado/evidencia y criterio de revisión, según tabla siguiente. |
| Métricas | Conservar las cuatro y sus fórmulas existentes; asociarlas a Desarrollo porque sus capturas miden ejecución de pruebas, PR y defectos. No distribuirlas artificialmente entre etapas. |
| Umbrales | Valores iniciales 90%/100% crítico, 100%, 100% y 0; QA configura los objetivos por proyecto. No son categorías de salud. |
| Periodo | Etiqueta opcional de agrupación, sin unicidad. Se permiten varios proyectos de un usuario/equipo en el mismo periodo. «Uno por periodo» no será una restricción de esta versión. |
| PDF | Máximo 3 MiB por archivo, una transferencia por petición, a través de Next.js; PDF y enlaces siguen siendo alternativas válidas. |
| Archivos fallidos | Registro técnico de reserva y objeto; compensación inmediata y limpieza administrativa diaria de objetos no referenciados con antigüedad mínima de 24 horas. |
| Reporte | Captura autocontenida cifrada, válida 15 minutos y ligada a usuario/proyecto; no depende de memoria local de una función ni crea histórico de reportes. |
| Contratos | Funciones internas y RPC acotadas especificadas en [contratos v1](../arquitectura/contratos-v1-propuesta.md). |
| PostgreSQL | Límites, precisión, constraints, privilegios y funciones definidos en [detalle técnico v1](../datos/detalle-tecnico-v1-propuesta.md). Sin SQL ejecutable. |

**Alcance:** se resuelven los pendientes enumerados en la conversación. La instalación, versiones exactas y cuentas de despliegue corresponden al bootstrap posterior. El cumplimiento de RNF se comprobará al implementar. Una eventual ratificación académica por la docente no se presume a partir de esta propuesta.

## Catálogo de actividades v1

Cada tipo tiene etapa fija. «Inicial» significa preseleccionada y desmarcable en CU-01; las otras siguen disponibles. Todas se pueden agregar posteriormente, incluidas instancias repetidas del mismo tipo.

Cada entrega requiere resultado en texto y al menos un PDF o enlace con la evidencia indicada. No se exige simultáneamente PDF y enlace, ni integración automática con GitHub u otra herramienta. QA evalúa el contenido; el sistema solo comprueba integridad y permisos. «Hallazgos» pueden declararse como ninguno, si el resultado lo justifica; no se crea un módulo de defectos.

| Código | Tipo conservado | Etapa | Inicial | Resultado y evidencia admisible | Criterio de aprobación QA |
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

## Catálogo de métricas v1

Las cuatro se capturan manualmente. No se agregan GitHub API, entidades internas de defectos ni edición arbitraria de fórmulas. QA referencia la fuente mediante texto breve o URL en cada revisión. La etapa se fija en el tipo y no se elige en la instancia.

| Código | Etapa | Datos fuente requeridos | Valor principal | Objetivo inicial configurable |
|---|---|---|---|---|
| M-01 | Desarrollo | `aprobadas`, `ejecutadas`, `criticas_aprobadas`, `criticas_ejecutadas` | `100 × aprobadas / ejecutadas` | General ≥ 90%; subconjunto de flujos críticos ≥ 100%. |
| M-02 | Desarrollo | `integrados_revisados`, `integrados` | `100 × integrados_revisados / integrados` | ≥ 100%. |
| M-03 | Desarrollo | `requisitos_probados`, `requisitos_definidos` | `100 × requisitos_probados / requisitos_definidos` | ≥ 100%. |
| M-04 | Desarrollo | `criticos_abiertos`, `altos_abiertos` | `criticos_abiertos + altos_abiertos` | ≤ 0. |

Todos los conteos son enteros entre 0 y 1 000 000 000 inclusive. No se aceptan claves desconocidas en `datos_fuente`. Cada captura requiere fecha de medición y `fuente_referencia` de 1 a 2048 caracteres, almacenada dentro del objeto validado; no es un archivo obligatorio adicional.

### Definiciones de captura

- **M-01:** casos ejecutados y aprobados en el alcance declarado de una ejecución, no suma arbitraria de ejecuciones históricas. Los críticos son el subconjunto de casos que cubre flujos críticos identificados por QA en la fuente. Aprobadas ≤ ejecutadas; críticas aprobadas ≤ críticas ejecutadas ≤ ejecutadas; críticas aprobadas ≤ aprobadas; aprobadas no críticas ≤ ejecutadas no críticas. Los casos no ejecutados no entran al denominador.
- **M-02:** PR integrados en el alcance/periodo declarado y cuántos tuvieron revisión registrada antes de integrarse. Revisados ≤ integrados. Captura acumulada o por periodo identificada en la fuente; QAlly no suma capturas como si fueran periodos disjuntos.
- **M-03:** requisitos distintos del alcance declarado con al menos una prueba ejecutada trazable, independientemente de que la prueba haya aprobado. Probados ≤ definidos. Mide cobertura de ejecución, no porcentaje de pruebas aprobadas ni solo casos diseñados. La meta inicial es 100%; un valor inferior describe el estado actual, sin inventar penalizaciones por fecha.
- **M-04:** fotografía a la fecha medida de defectos abiertos con severidad alta o crítica, categorías disjuntas según la fuente. No se cuentan defectos cerrados ni se vuelve a contar un crítico como alto. No hace falta registrar los defectos individualmente dentro de QAlly.

### Evaluación y precisión

- Denominador cero: valor principal nulo y condición No evaluable. Se conserva la captura, incluso todos los ceros. Sin ninguna captura sigue siendo Sin medición.
- M-01 conserva además la evaluación crítica derivada de sus datos. Si el denominador principal es positivo pero el crítico es cero, el valor general puede ser evaluable, pero el cumplimiento conjunto es No evaluable por ausencia de muestra crítica. No se declara cumplimiento de flujos críticos sin ejecutarlos.
- Cuando ambos denominadores de M-01 son positivos, Cumple exige satisfacer objetivo general y crítico. En M-02/03 se compara con el objetivo; M-04 usa límite superior entero.
- Porcentajes calculados con aritmética decimal, persistidos como `numeric(20,8)` y mostrados con dos decimales. La comparación usa los conteos exactos por multiplicación cruzada, no el porcentaje redondeado de pantalla.
- Objetivos porcentuales en [0,100], con hasta cuatro decimales; M-04 objetivo entero en [0,2 000 000 000]. QA puede cambiar objetivos en proyectos abiertos. Para M-01 se agrega `objetivo_critico`; ver el delta de esquema. No se habilitan intervalos ni comparadores arbitrarios en v1.

## Periodo y alcance de la versión

El periodo admite una etiqueta libre de hasta 40 caracteres, por ejemplo «2026-2»; se recortan espacios externos y una cadena vacía se normaliza a nulo. No se infiere curso, equipo, fechas o permisos desde esa etiqueta. No hay validación de unicidad ni se agrega entidad «periodo». Dos proyectos con mismo nombre/periodo son válidos; los IDs los distinguen.

Los campos del proyecto aprobados en ADR-001 se mantienen. El objetivo es cerrar el pendiente ambiguo sin introducir un límite que impida a QA gestionar varios proyectos.

## Decisiones técnicas que requieren revisión expresa

1. Añadir una tabla técnica `archivo_evidencia`: permite reservar, validar y limpiar un objeto una sola vez aunque se reutilice en varios intentos; evita metadata duplicada y carreras de borrado.
2. Añadir dos columnas a proyecto para deduplicar reintentos del alta; no es una funcionalidad visible nueva.
3. Añadir `objetivo_critico` a métrica de proyecto para conservar la meta crítica ya presente en M-01; no eliminarla por falta de campo.
4. Permitir un adaptador privilegiado de archivos aislado en servidor, tras autorización de usuario, para garantizar que no se pueda saltar la validación subiendo directamente a Storage. El resto de módulos continúa con sesión del usuario y RLS. Sus límites y RPC están especificados, no se autoriza usarlo como cliente de datos genérico.
5. Usar captura de reporte cifrada mediante primitivas de Node.js del stack existente, sin Redis ni tabla histórica.

## Trazabilidad y adopción

| Cambio | Requisitos afectados | Fuentes a actualizar al aprobar |
|---|---|---|
| Catálogo de actividades y preselección | CU-01/03/04; RF-02, 04, 15–25 | Catálogo, reglas globales, mapas de módulos y semillas documentadas. |
| Captura, etapas y objetivos de métricas | CU-01/02/05/06; RF-03, 08–14, 28–32; RNF-08/10 | Catálogo, CU-02, diccionario, ER y contratos. |
| Periodo informativo | CU-01; RF-01, 06 | CU-01, reglas globales, pendientes y diccionario. |
| Archivo privado validado y limpieza | CU-04; RF-23–25, 33; RNF-01–03, 08–09 | ER, diccionario, seguridad/integridad, C2/C3 y ADR. |
| Funciones y contratos compartidos | Los seis CU; RF-33; RNF-01–10 | C3, seguridad/integridad, trazabilidad y plan de bootstrap. |
| Captura de reporte | CU-06; RF-30–32; RNF-03/06 | C3, seguridad/integridad y CU-06. |

Al aprobar: registrar ADR-002 con estos acuerdos; consolidar las fuentes anteriores sin alterar ADR-001 como registro histórico; cambiar estado de pendientes a resueltos en diseño y dejar salud pendiente. La aprobación no se extiende a ejecutar SQL, instalar, desplegar ni modificar Supabase.

## Referencias técnicas verificadas

Los valores de producto de esta propuesta son elecciones de diseño; las referencias siguientes solo fundamentan compatibilidad técnica:

- [Vercel: límites de Functions](https://vercel.com/docs/functions/limitations): documenta límite de petición/respuesta de 4,5 MB; el PDF propuesto de 3 MiB deja margen y se envía sin base64.
- [Next.js: Server Actions](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions): límite predeterminado de 1 MB; por ello el PDF y la exportación con captura se reciben en Route Handlers con límites propios.
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [Storage](https://supabase.com/docs/guides/storage/security/access-control): combinar privilegios/políticas y aislar accesos que eluden RLS.
- [PostgreSQL: bloqueos](https://www.postgresql.org/docs/current/explicit-locking.html): comprobar cierre y mutación bajo bloqueos de fila de duración transaccional.
- [Node.js: crypto](https://nodejs.org/api/crypto.html): primitivas disponibles para una captura cifrada y autenticada; no requiere proveedor externo.
