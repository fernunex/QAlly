# Catálogo de métricas v1

**Estado: APROBADO para esta versión, 2026-10-18.** [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). Salud conserva su algoritmo y clasificación PENDIENTES. No se presume ratificación académica independiente.

Las cuatro se capturan manualmente. No se agregan GitHub API, entidades internas de defectos ni edición arbitraria de fórmulas. QA referencia la fuente mediante texto breve o URL en cada revisión. La etapa se fija en el tipo y no se elige en la instancia.

| Código | Métrica | Etapa | Datos fuente requeridos | Valor principal | Objetivo inicial configurable |
|---|---|---|---|---|---|
| M-01 | Tasa de pruebas aprobadas | Desarrollo | `aprobadas`, `ejecutadas`, `criticas_aprobadas`, `criticas_ejecutadas` | `100 × aprobadas / ejecutadas` | General ≥ 90%; subconjunto de flujos críticos ≥ 100%. |
| M-02 | Porcentaje de PR revisados | Desarrollo | `integrados_revisados`, `integrados` | `100 × integrados_revisados / integrados` | ≥ 100%. |
| M-03 | Cobertura de requisitos probados | Desarrollo | `requisitos_probados`, `requisitos_definidos` | `100 × requisitos_probados / requisitos_definidos` | ≥ 100%. |
| M-04 | Defectos de alta severidad abiertos | Desarrollo | `criticos_abiertos`, `altos_abiertos` | `criticos_abiertos + altos_abiertos` | ≤ 0. |

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
- Objetivos porcentuales en [0,100], con hasta cuatro decimales; M-04 objetivo entero en [0,2 000 000 000]. QA puede cambiar objetivos en proyectos abiertos. Para M-01 se agrega `objetivo_critico`; ver el [diccionario](../datos/diccionario-datos.md). No se habilitan intervalos ni comparadores arbitrarios en v1.

Las claves de definición son `m01_pruebas_v1`, `m02_pr_v1`, `m03_requisitos_v1` y `m04_defectos_v1`; unidad `%` para las tres primeras y `defectos` para M-04. M-04 conserva la sustitución previa de DER, sin un módulo interno de defectos.

**Trazabilidad:** CU-01/02/05/06; RF-03, RF-08–14, RF-28–33; RNF-01–10 según matriz CU–RF–RNF.
