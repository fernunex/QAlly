# Módulo: Dashboard y estado de salud

**Caso de uso:** [CU-05](../requisitos/casos-uso/CU-05.md)  
**RF:** RF-26 a RF-29, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Consulta de datos actuales, métricas/umbrales/actividades por tres etapas, indicadores y espacios para estado de salud general/por etapa.

## Reglas esenciales acordadas
NO inventar fórmula, pesos, rangos Malo/Regular/Bueno/Excelente ni interpretar pendientes como mala salud; mostrar Sin medición para métricas sin captura y Sin evaluar para salud; misma lógica que reporte.

## Interfaces y dependencias
Métricas y actividades; CU-06 debe utilizar el mismo resultado cuando el cálculo esté definido.

## Pendientes relevantes
Algoritmo, pesos, clasificación, valores de corte, ausencia de datos y etapas sin mediciones.

## Lectura mínima para Codex
1. Este archivo y `CU-05.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
Usar consulta/contrato de indicadores v1 aprobado y compartido con reportes; no introducir categorías ni puntuaciones hasta aprobación del algoritmo.

## Estado de implementación — 2026-10-20

Consulta de CU-05 implementada en `feat/cu05-salud-proyecto`: adaptador `consultarResumen` y DTO `ResumenProyecto` (`src/features/health/`), reutilizables por CU-06, y pestaña **Salud** con datos reales. Salud general y por etapa permanecen «Sin evaluar»; algoritmo, pesos y clasificación siguen **PENDIENTES**. [Realización, pruebas y trazabilidad](cu05-implementacion.md).
