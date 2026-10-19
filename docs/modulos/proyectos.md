# Módulo: Gestión de proyectos

**Caso de uso:** [CU-01](../requisitos/casos-uso/CU-01.md)  
**RF:** RF-01 a RF-07, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Alta de proyecto y miembros, selector de actividades iniciales preseleccionadas/editables, selección de métricas y umbrales, consultas, edición y cierre conservando datos.

## Reglas esenciales acordadas
QA registra/modifica/cierra; QA y miembro autorizado consultan. Solo se crean actividades iniciales seleccionadas; etapas provienen del catálogo.

Campos generales y cierre en solo lectura aprobados en [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md): nombre, descripción e inicio obligatorios; periodo y fin previsto opcionales. Rol global con participación por proyecto.

## Interfaces y dependencias
Catálogos, membresía/roles, consulta de actividades/métricas.

## Pendientes relevantes
Implementar SQL y contratos aprobados; periodo informativo ya resuelto, sin unicidad. [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md).

## Lectura mínima para Codex
1. Este archivo y `CU-01.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
Para nuevas operaciones o consultas, validar rol y participación en servidor y RLS. Usar los campos del [diccionario](../datos/diccionario-datos.md) y las transacciones/bloqueo de cierre de [seguridad e integridad](../datos/seguridad-integridad.md).
