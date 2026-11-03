# Módulo: Dashboard y estado de salud

**Caso de uso:** [CU-05](../requisitos/casos-uso/CU-05.md)  
**RF:** RF-26 a RF-29, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Consulta de datos actuales, métricas/umbrales/actividades por tres etapas, indicadores y salud porcentual/clasificada general y por etapa.

## Reglas esenciales acordadas
**Requisito APROBADO, 2026-10-30, DEC-27:** aplicar las [reglas de salud](../producto/reglas-globales.md#salud-aprobada) y CU-05: peso igual por elemento, aporte normalizado y cuatro rangos. Distinguir evaluación parcial, 0% y Sin evaluar sin elementos; misma definición/resultados que reporte.

## Interfaces y dependencias
Métricas y actividades; CU-06 debe utilizar los mismos resultados de cálculo.

## Pendientes relevantes
Integración técnica realizada (ADR-003). Pendiente: medir rendimiento desplegado y registrar la ejecución E2E en Firefox. [Pendientes y brechas](../requisitos/pendientes-y-brechas.md).

## Lectura mínima para Codex
1. Este archivo y `CU-05.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
Usar consulta/contrato de indicadores v1 aprobado y compartido con reportes; evaluar su adecuación al requisito aprobado y coordinar las modificaciones técnicas antes de implementarlas.

## Estado de implementación — 2026-11-02

Salud general y por etapa **calculada** según DEC-27 en `feat/salud-dec27` ([ADR-003](../decisiones/ADR-003-salud-y-reporte.md)): `private.salud_json` dentro de `consultar_resumen`; la pestaña Salud muestra porcentaje, clasificación, puntos, aporte por métrica y advertencias; el listado y el encabezado del proyecto usan `consultar_salud`. Objetivo 0 %, nulos y objetivos históricos resueltos por DEC-29–31. Pruebas: `tests/database/salud.test.mjs`, `tests/unit/salud.test.ts`, `tests/e2e/cu05.spec.ts` y el [plan de pruebas](../equipo/plan-pruebas-dec25-28.md).

## Estado de implementación — 2026-10-20 (histórico)

Consulta de CU-05 implementada en `feat/cu05-salud-proyecto`: adaptador `consultarResumen` y DTO `ResumenProyecto` (`src/features/health/`), reutilizables por CU-06, y pestaña **Salud** con datos reales. El código existente conserva salud general y por etapa «Sin evaluar». **Diferencia respecto al requisito aprobado:** algoritmo, pesos y clasificación ya están aprobados por DEC-27; su implementación y pruebas quedan pendientes. [Realización, pruebas y trazabilidad](cu05-implementacion.md).
