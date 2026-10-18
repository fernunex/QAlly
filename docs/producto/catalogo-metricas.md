## 5. Catálogo preliminar de métricas

### M-01 — Tasa de pruebas aprobadas

**Cálculo:** (Pruebas aprobadas / pruebas ejecutadas) × 100

**Objetivo provisional:** ≥ 90% general; 100% en flujos críticos

**Registro y evidencia:** Casos de prueba y reportes de pruebas; QA registra conteos de aprobadas y ejecutadas.

### M-02 — Porcentaje de PR revisados

**Cálculo:** (PR integrados con revisión / PR integrados) × 100

**Objetivo provisional:** 100%

**Registro y evidencia:** GitHub Pull Requests; QA registra el número de PR integrados y los revisados.

### M-03 — Cobertura de requisitos probados

**Cálculo:** (Requisitos probados / requisitos definidos) × 100

**Objetivo provisional:** 100% antes de la entrega final

**Registro y evidencia:** SRS, matriz de trazabilidad y casos de prueba; QA registra totales.

### M-04 — Defectos de alta severidad abiertos

**Cálculo:** Defectos críticos abiertos + defectos altos abiertos

**Objetivo provisional:** 0 defectos críticos o altos abiertos

**Registro y evidencia:** GitHub Issues u otro registro; QA consigna el conteo revisado en la fecha de medición.

Regla de captura: cada registro es una medición con fecha, responsable, valor y datos de origen pertinentes. Los conteos de 0 deben medirse explícitamente: la falta de medición no equivale a cero. Si el denominador de una tasa es cero, se muestra «Sin medición / No evaluable» hasta contar con datos.

Pendiente: etapa predeterminada para cada métrica y si el objetivo varía por proyecto. Los umbrales aquí expresados son los propuestos por el equipo, no una clasificación definitiva de salud.

**Estado:** PRELIMINAR. Asignación final de la etapa, criterios de datos fuente, umbrales y denominadores pendientes de validar. M-04 sustituye a DER; la captura prevista es manual, no una integración con GitHub.
