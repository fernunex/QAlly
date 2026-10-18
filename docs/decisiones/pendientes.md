# Decisiones pendientes — corte 2026-10-18

El **stack tecnológico y el monolito modular ya están aprobados**: ver `../arquitectura/stack-aprobado.md`. No volver a tratarlos como selecciones abiertas salvo propuesta explícita de cambio.

| Prioridad | Por resolver | Puede avanzar mientras tanto |
|---|---|---|
| **Alta** | Algoritmo de salud general/por etapa: pesos, rangos, datos ausentes y actividades pendientes. | Consultas, indicadores, dashboard, estado «Sin evaluar» y estructura de PDF. |
| **Alta** | Catálogo final de 10 actividades, evidencia por tipo, criterios de aprobación y selección inicial. | Tablas de catálogo y semillas preliminares editables. |
| **Alta** | Catálogo final de cuatro métricas, etapa por tipo, datos fuente y umbrales definitivos. | Selección, mediciones e historial usando catálogo provisional. |
| **Alta** | Diseño ER de PostgreSQL, restricciones, políticas RLS, seguridad de Storage y contratos entre módulos. | Elaborar y revisar diagramas; bootstrap después de aprobación. |
| **Media** | Versiones de dependencias/Node, configuración Supabase/Vercel, variables de entorno, pruebas y CI concretos. | Preparar plan de bootstrap y documentar alternativas. |
| **Media** | Campos obligatorios de Proyecto y significado de «uno por periodo». | Modelar estructura revisable sin restricción inventada. |
| **Media** | Qué cambios se bloquean exactamente al cerrar un proyecto. | Mantener cierre y consulta; marcar validaciones pendientes. |
| **Media** | Tamaño máximo del PDF, validación de enlaces, subida fallida y limpieza de archivos huérfanos. | Diseñar Storage privado y escenarios RNF-09. |
| **Media** | Dataset y entorno de ejecución para medición de RNF; comandos verificables del repositorio. | Preparar casos de prueba y evidencia. |
| **Media** | Apartados adicionales de la plantilla SRS de la asignatura. | Usar los documentos canónicos para completarlos. |

**No bloquear salud:** su funcionalidad no se elimina ni se deja fuera del diseño; únicamente el algoritmo y la clasificación quedan por definir.

Para cerrar un pendiente: registrar acuerdo fechado en `registro.md`, actualizar su fuente canónica y las referencias CU/RF/RNF que correspondan.
