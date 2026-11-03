# Módulo: Reportes de calidad

**Caso de uso:** [CU-06](../requisitos/casos-uso/CU-06.md)  
**RF:** RF-30 a RF-32, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Reporte actual del proyecto, visualización en la web y exportación PDF con métricas, actividades/evidencias, emisión en hora CDMX, salud general/tres etapas y advertencias.

## Reglas esenciales acordadas
Solo QA genera/exporta; mismo origen de información que CU-05; usar los resultados de salud aprobados en CU-05 y el [contenido mínimo del reporte](../producto/reglas-globales.md#contenido-del-reporte), DEC-28. Referenciar evidencias con autorización sin incrustar PDF ni almacenar historial de PDFs de reporte.

## Interfaces y dependencias
Consultas de proyectos, métricas y actividades, y consulta compartida de indicadores y salud aprobada; su contrato actual requiere evaluación técnica.

## Estado de implementación
Generación, vista, captura cifrada de 15 minutos y exportación PDF implementadas en `feat/cu06-reportes` según [contratos v1](../arquitectura/contratos-v1.md): [registro de implementación y pruebas](cu06-implementacion.md).

## Pendientes relevantes
**2026-11-02, `feat/salud-dec27`:** vista y PDF incluyen salud general y por etapa con porcentaje, clasificación, puntos y advertencias; sección de advertencias; aporte y criterio crítico por métrica; instancia y evidencias (enlaces o PDF referenciado por la ruta autorizada) del último intento enviado. Orden: salud, advertencias, métricas, actividades. [ADR-003](../decisiones/ADR-003-salud-y-reporte.md). Medición RNF-06 en entorno desplegado pendiente.

## Lectura mínima para Codex
1. Este archivo y `CU-06.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
La implementación usa `@react-pdf/renderer` 4.9.0 y reutiliza `consultarResumen`/`ResumenProyecto` de CU-05 con la salud calculada por la BD (ADR-003); el PDF recibe el mismo modelo que la vista.
