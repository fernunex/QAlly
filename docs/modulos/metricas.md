# Módulo: Gestión de métricas

**Caso de uso:** [CU-02](../requisitos/casos-uso/CU-02.md)  
**RF:** RF-08 a RF-14, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Agregar métricas de catálogo después de crear proyecto; objetivos, mediciones, histórico, correcciones auditables y comparación de umbrales.

## Reglas esenciales acordadas
No duplicar el mismo tipo por proyecto; un registro nuevo no reemplaza anteriores; correcciones conservan antiguo/nuevo/autor/fecha; sin medición ≠ cero.

## Interfaces y dependencias
Catálogo de métricas y selección por proyecto; CU-05/06 consumen último valor y cumplimiento.

## Pendientes relevantes
El [catálogo v1](../producto/catalogo-metricas.md), restricciones y RPC de mediciones/correcciones están implementados en la BD local. CU-01 ya configura y consulta métricas iniciales/objetivos con datos reales. Falta conectar los componentes UI de CU-02 a las acciones y consultas de servidor, con pruebas E2E; no considerar sus componentes de prototipo un flujo persistente. Algoritmo de salud ajeno a este cálculo sigue pendiente. [Estado local](cu01-implementacion.md).

## Lectura mínima para Codex
1. Este archivo y `CU-02.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
Las correcciones deben preservar histórico de forma transaccional en PostgreSQL; fuentes y etapas están aprobadas en el catálogo v1, sin algoritmo de salud.
