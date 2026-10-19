# Módulo: Administración de actividades SQA

**Caso de uso:** [CU-03](../requisitos/casos-uso/CU-03.md)  
**RF:** RF-15 a RF-19, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Consulta, alta de actividad del catálogo con descripción específica, asignación a miembro, aprobación o devolución con observaciones.

## Reglas esenciales acordadas
Un tipo se repite en un proyecto; actividades nuevas en Pendiente; solo QA aprueba/devuelve En revisión; devolución retorna a En progreso.

## Interfaces y dependencias
Catálogo de actividades, membresía y flujo de CU-04.

## Pendientes relevantes
Implementación y pruebas del [catálogo v1 aprobado](../producto/catalogo-actividades.md) y [contratos](../arquitectura/contratos-v1.md); criterios por tipo ya definidos.

## Lectura mínima para Codex
1. Este archivo y `CU-03.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
Estados y autorizaciones deben aplicarse en servidor y respetarse por RLS; transiciones definidas en los contratos v1 aprobados, con versión esperada.
