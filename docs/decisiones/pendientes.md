# Decisiones pendientes — corte 2026-10-18

Stack, monolito modular y diseño v1 aprobados por [ADR-001](ADR-001-diseno-tecnico-v1.md) y [ADR-002](ADR-002-cierre-diseno-v1.md). La autorización actual comprende documentación; no ejecución de código, migraciones ni cambios externos.

## Pendiente de diseño del producto

| Prioridad | Por resolver | Puede avanzar mientras tanto |
|---|---|---|
| Alta | Algoritmo de salud general/por etapa: pesos, categorías, rangos, tratamiento de datos ausentes y actividades pendientes. | Consultas, indicadores, resumen general y tres etapas con Sin evaluar; reporte sin puntajes inventados. |

La salud es el único pendiente de producto de este cierre, por instrucción expresa del usuario. No se elimina RF-26/27.

## Resueltos en diseño — ADR-002

| Acuerdo | Fuente canónica |
|---|---|
| Diez actividades, cinco preselecciones, evidencia y criterios QA por tipo. | [Catálogo de actividades](../producto/catalogo-actividades.md). |
| Cuatro métricas en Desarrollo, capturas/fórmulas y objetivos configurables, incluido objetivo crítico de M-01. | [Catálogo de métricas](../producto/catalogo-metricas.md). |
| Periodo opcional informativo, varios proyectos permitidos, sin unicidad. | Reglas globales, CU-01 y diccionario. |
| PDF 3 MiB, validación, reserva, compensación y limpieza diaria tras 24 horas sin referencias. | [Seguridad e integridad](../datos/seguridad-integridad.md). |
| Tipos, longitudes, numeric(20,8), constraints, archivo físico, privilegios y bloqueos. | [Diccionario](../datos/diccionario-datos.md), [detalle técnico](../datos/detalle-tecnico-v1.md) y ER. |
| Interfaces, idempotencia, versiones y captura cifrada de reporte de 15 minutos. | [Contratos v1](../arquitectura/contratos-v1.md). |
| Dataset de aceptación: proyectos aislados, abierto grande, pequeño y cerrado, historiales y fallos. | Detalle técnico y escenarios RNF en seguridad/integridad. |

## Trabajo posterior de implementación y validación

- SQL ejecutable, funciones/políticas, script de limpieza, aplicación de contratos TypeScript y pruebas. Se siguen los acuerdos, sin reabrir reglas por suposición.
- Versiones exactas Node/dependencias, configuración de sesión SSR, cuentas/planes/regiones, variables, CI y estructura física. Preparar plan de bootstrap antes de instalar.
- Crear dataset y ejecutar pruebas de RLS, concurrencia, archivos, rendimiento y Chrome/Firefox. Registrar equipo, entorno, versiones, conexión y resultados; no afirmar RNF superados solo por diseño.
- Revisar apartados y obligaciones del SRS académico con las fuentes originales disponibles; no presumir ratificación de la docente.

Las propuestas se conservan como antecedentes históricos con enlaces a sus reemplazos; no son decisiones todavía pendientes. Para futuros cambios, registrar nueva aprobación y actualizar fuente canónica y trazabilidad CU–RF–RNF.
