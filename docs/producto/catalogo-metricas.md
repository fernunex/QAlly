# Catálogo de métricas v1

**Estado: APROBADO y ratificado por el responsable del proyecto el 2026-10-30**, [DEC-26](../decisiones/registro.md#cierre-funcional--2026-10-30). Base histórica: [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). No se presume ratificación académica independiente. La [salud aprobada](reglas-globales.md#salud-aprobada) normaliza el valor principal de estas cuatro métricas.

Las cuatro se capturan manualmente. No se agregan GitHub API, entidades internas de defectos ni edición arbitraria de fórmulas. QA puede referenciar opcionalmente la fuente mediante texto breve o URL en cada revisión; su ausencia no impide registrar ni corregir una medición. La etapa se fija en el tipo y no se elige en la instancia.

| Código | Métrica | Etapa | Datos fuente requeridos | Valor principal | Objetivo inicial configurable |
|---|---|---|---|---|---|
| M-01 | Tasa de pruebas aprobadas | Desarrollo | `aprobadas`, `ejecutadas` | `100 × aprobadas / ejecutadas` | ≥ 90% general. El criterio crítico es independiente. |
| M-02 | Porcentaje de PR revisados | Desarrollo | `integrados_revisados`, `integrados` | `100 × integrados_revisados / integrados` | ≥ 100%. |
| M-03 | Cobertura de requisitos probados | Desarrollo | `requisitos_probados`, `requisitos_definidos` | `100 × requisitos_probados / requisitos_definidos` | ≥ 100%. |
| M-04 | Defectos de alta severidad abiertos | Desarrollo | `criticos_abiertos`, `altos_abiertos` | `criticos_abiertos + altos_abiertos` | ≤ 0. |

Todos los conteos son enteros entre 0 y 1 000 000 000 inclusive. No se aceptan claves desconocidas en `datos_fuente`. Cada captura requiere fecha de medición y conteos suficientes para calcular el valor. `fuente_referencia` es opcional; si se proporciona, es texto o URL de 1 a 2048 caracteres, sin archivo obligatorio adicional. La validación estricta debe distinguir datos del cálculo de una referencia ausente; su adaptación técnica está en [brechas](../requisitos/pendientes-y-brechas.md).

### Definiciones de captura

- **M-01:** casos ejecutados y aprobados en el alcance declarado de una ejecución, no suma arbitraria de ejecuciones históricas. Aprobadas ≤ ejecutadas. El 100% de pruebas de flujos críticos aprobadas se conserva como criterio independiente de pruebas; no crea M-05, no condiciona el cumplimiento general ni forma parte del aporte M-01 a salud. Si se registran conteos críticos, son un subconjunto identificado por QA: críticas aprobadas ≤ críticas ejecutadas ≤ ejecutadas; críticas aprobadas ≤ aprobadas; aprobadas no críticas ≤ ejecutadas no críticas. Sin ejecución crítica no se puede afirmar que ese criterio se satisfizo. Los casos no ejecutados no entran al denominador.
- **M-02:** PR integrados en el alcance/periodo declarado y cuántos tuvieron revisión registrada por otro integrante antes de integrarse; no se exige aprobación formal si la revisión está documentada. Revisados ≤ integrados. Captura acumulada o por periodo con alcance declarado; QAlly no suma capturas como si fueran periodos disjuntos.
- **M-03:** requisitos distintos del alcance declarado con al menos una prueba ejecutada trazable, independientemente de que la prueba haya aprobado. Probados ≤ definidos. Mide cobertura de ejecución, no porcentaje de pruebas aprobadas ni solo casos diseñados. La meta inicial es 100%; un valor inferior describe el estado actual, sin inventar penalizaciones por fecha.
- **M-04:** fotografía a la fecha medida de defectos abiertos con severidad alta o crítica, categorías disjuntas según GitHub Issues u otro registro externo. No se cuentan defectos cerrados ni se vuelve a contar un crítico como alto. No hace falta registrar los defectos individualmente dentro de QAlly.

### Evaluación y precisión

- Denominador cero: valor principal nulo y condición No evaluable. Se conserva la captura, incluso todos los ceros. Sin ninguna captura sigue siendo Sin medición.
- M-01 compara exclusivamente su valor general con el objetivo general; la ausencia o resultado de la muestra crítica no bloquea esa evaluación. La evaluación de pruebas críticas se informa separadamente.
- M-02/03 comparan con el objetivo porcentual; M-04 usa límite superior entero. El aporte proporcional a salud es distinto del cumplimiento binario y sigue las [reglas comunes](reglas-globales.md#salud-aprobada).
- Porcentajes calculados con aritmética decimal, persistidos como `numeric(20,8)` y mostrados con dos decimales. La comparación usa los conteos exactos por multiplicación cruzada, no el porcentaje redondeado de pantalla.
- Objetivos porcentuales en [0,100], con hasta cuatro decimales; M-04 objetivo entero en [0,2 000 000 000]. QA puede cambiar objetivos en proyectos abiertos. La posibilidad heredada de objetivo porcentual 0 queda sin fórmula de aporte aprobada; ver [pendiente RQ-01](../requisitos/pendientes-y-brechas.md#pendientes-de-requisitos). El [diccionario](../datos/diccionario-datos.md) y contratos todavía exigen `objetivo_critico` en M-01: es una brecha técnica, no un nuevo acuerdo funcional ni autorización para eliminar el campo. No se habilitan intervalos ni comparadores arbitrarios en v1.

Las claves de definición son `m01_pruebas_v1`, `m02_pr_v1`, `m03_requisitos_v1` y `m04_defectos_v1`; unidad `%` para las tres primeras y `defectos` para M-04. M-04 conserva la sustitución previa de DER, sin un módulo interno de defectos.

**Trazabilidad:** CU-01/02/05/06; RF-03, RF-08–14, RF-28–33; RNF-01–10 según matriz CU–RF–RNF.
