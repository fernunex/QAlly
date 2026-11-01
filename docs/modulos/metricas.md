# Módulo: Gestión de métricas

**Caso de uso:** [CU-02](../requisitos/casos-uso/CU-02.md)  
**RF:** RF-08 a RF-14, RF-33 → [catálogo](../requisitos/funcionales.md)  
**RNF aplicables:** [matriz de trazabilidad](../requisitos/trazabilidad.md); [criterios de prueba](../requisitos/no-funcionales.md).

## Objetivo
Agregar métricas de catálogo después de crear proyecto; objetivos, mediciones, histórico, correcciones auditables y comparación de umbrales.

## Reglas esenciales acordadas
No duplicar el mismo tipo por proyecto; un registro nuevo no reemplaza anteriores; correcciones conservan antiguo/nuevo/autor/fecha; sin medición ≠ cero. Fuente opcional y criterio crítico independiente de M-01, según [catálogo ratificado](../producto/catalogo-metricas.md), DEC-26. M-02 requiere revisión previa por otra persona y M-03 prueba ejecutada.

## Interfaces y dependencias
Catálogo de métricas y selección por proyecto; CU-05/06 consumen último valor y cumplimiento.

## Pendientes relevantes
La versión anterior del catálogo, sus restricciones y RPC de mediciones/correcciones están implementadas en la BD local; el [catálogo ratificado](../producto/catalogo-metricas.md) contiene cambios funcionales posteriores. CU-01 configura métricas iniciales/objetivos al crear el proyecto. CU-02 está conectado a las acciones y consultas de servidor, con pruebas unitarias y E2E: [implementación y pruebas](cu02-implementacion.md). El algoritmo de salud está aprobado en las [reglas comunes](../producto/reglas-globales.md#salud-aprobada). Fuente obligatoria y evaluación conjunta M-01 del código son [brechas pendientes de adecuación y pruebas](../requisitos/pendientes-y-brechas.md).

## Lectura mínima para Codex
1. Este archivo y `CU-02.md` enlazado.
2. Reglas globales **solo** si hay dudas de permisos, etapas, catálogo o estados.
3. RF/RNF específicos, no el catálogo completo salvo tarea de documentación/pruebas.

**Nota:** este archivo orienta el trabajo; el caso de uso y el registro de decisiones son las fuentes de detalle.

## Consideración técnica de implementación
Las correcciones deben preservar histórico de forma transaccional en PostgreSQL; respetar las reglas del catálogo ratificado y evaluar las incompatibilidades técnicas con contratos/BD sin asumir que ya fueron modificados.
