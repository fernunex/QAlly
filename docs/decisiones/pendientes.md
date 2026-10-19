# Decisiones pendientes — corte 2026-10-19

Stack, monolito modular y diseño v1 aprobados por [ADR-001](ADR-001-diseno-tecnico-v1.md) y [ADR-002](ADR-002-cierre-diseno-v1.md). ADR-001/002 aprobaron documentación. El usuario autorizó posteriormente ejecutar el [bootstrap local](../datos/plan-bootstrap-supabase.md); la conexión a Cloud se pospone expresamente hasta que disponga de proyecto. No se autoriza push ni despliegue.

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

- Adaptadores de aplicación Next.js de CU-02 a CU-06; CU-01 y sesión real ya implementados. SQL, funciones/RLS, limpieza, tipos generados y pruebas de API/BD disponibles; consultar resultados del bootstrap.
- Cuentas/planes/regiones remotos y configuración de despliegue. Sesión SSR local implementada en CU-01. Node/dependencias de datos y variables locales fijados tras el plan autorizado; workflow preparado, ejecución en GitHub pendiente.
- Rendimiento desplegado y pruebas de los CU restantes. CU-01 ya tiene pruebas E2E en Chrome estable y Firefox; RLS, concurrencia y archivos tienen pruebas locales de BD. Dataset y resultados en el plan de bootstrap y la guía de CU-01. No afirmar todos los RNF superados.
- Revisar apartados y obligaciones del SRS académico con las fuentes originales disponibles; no presumir ratificación de la docente.

Las propuestas se conservan como antecedentes históricos con enlaces a sus reemplazos; no son decisiones todavía pendientes. Para futuros cambios, registrar nueva aprobación y actualizar fuente canónica y trazabilidad CU–RF–RNF.

## Integración local — 2026-10-19

UI y base de datos reunidas y verificadas sobre `dev`; la rama siguiente es `feat/cu01-gestion-proyectos`. [Registro de integración](../equipo/integracion-ui-bd.md), incluyendo los avisos transitivos de auditoría pendientes. Autenticación/sesión real y CU-01 ya conectados y validados localmente: [resultados](../modulos/cu01-implementacion.md). Los demás casos se implementarán progresivamente reutilizando la UI. Salud permanece pendiente de diseño; publicación de ramas/PR y Cloud no ejecutados.
