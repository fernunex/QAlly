# Módulo: Reportes de calidad

**Caso de uso:** [CU-06](../requisitos/casos-uso/CU-06.md)  
**RF:** RF-30 a RF-32, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Reporte actual del proyecto, visualización en la web y exportación PDF con métricas, actividades, fecha, datos de salud disponibles.

## Reglas esenciales acordadas
Solo QA genera/exporta; mismo origen de información que CU-05; no mostrar clasificación inventada ni almacenar historial de reportes.

## Interfaces y dependencias
Consultas de proyectos, métricas y actividades, y servicio futuro compartido de salud.

## Pendientes relevantes
Clasificación de salud cuando se apruebe. La biblioteca PDF seleccionada es `@react-pdf/renderer`; formato y contrato del reporte por diseñar.

## Lectura mínima para Codex
1. Este archivo y `CU-06.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
La implementación usará `@react-pdf/renderer`; reutilizar los datos actuales de CU-05 sin inventar clasificación de salud.
