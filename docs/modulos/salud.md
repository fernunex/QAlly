# Módulo: Dashboard y estado de salud

**Caso de uso:** [CU-05](../requisitos/casos-uso/CU-05.md)  
**RF:** RF-26 a RF-29, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Consulta de datos actuales, métricas/umbrales/actividades por tres etapas, indicadores y espacios para estado de salud general/por etapa.

## Reglas esenciales acordadas
NO inventar fórmula, pesos, rangos Malo/Regular/Bueno/Excelente ni interpretar pendientes como mala salud; mostrar Sin medir/Sin evaluar; misma lógica que reporte.

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
Diseñar consulta/contrato de indicadores compartible con reportes; no introducir categorías ni puntuaciones hasta aprobación del algoritmo.
