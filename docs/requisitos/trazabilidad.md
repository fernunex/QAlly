## 8. Matriz de trazabilidad CU–RF–RNF

| **Caso de uso** | **RF relacionados**  | **RNF relacionados**                   |
|-----------------|----------------------|----------------------------------------|
| CU-01           | RF-01 a RF-07; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09     |
| CU-02           | RF-08 a RF-14; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09, 10 |
| CU-03           | RF-15 a RF-19; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09     |
| CU-04           | RF-20 a RF-25; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09     |
| CU-05           | RF-26 a RF-29; RF-33 | RNF-01, 02, 03, 04, 07                 |
| CU-06           | RF-30 a RF-32; RF-33 | RNF-01, 02, 03, 06, 07                 |

**Uso:** ajustar referencias cuando se modifique un RF, RNF o CU. Consultar documentos canónicos para detalles.

## Trazabilidad con diseño aprobado — 2026-10-18

Se conservan los 33 RF, diez RNF y sus identificadores. [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md) precisa campos/cierre, rol global con acceso por proyecto, intentos y correcciones; no incorpora módulos nuevos. [C3](../arquitectura/C4-03-componentes.md) incluye la matriz componentes–CU y [diseño arquitectural](../arquitectura/diseno-arquitectural.md) valida la coherencia C4–datos–CU–RNF.

| CU | Decisiones y datos vinculados | Control relevante |
|---|---|---|
| CU-01 | Proyecto, participación y configuración inicial; campos y cierre de solo lectura. | RF-01–07, 33; RNF-01–05, 07–09. |
| CU-02 | Métrica por proyecto única, medición y revisiones inmutables; vigencia temporal estable. | RF-08–14, 33; RNF-01–05, 07–10. |
| CU-03 | Actividad repetible, responsable del proyecto y revisión de entrega. | RF-15–19, 33; RNF-01–05, 07–09. |
| CU-04 | Intentos de entrega y evidencias privadas, envío atómico con compensación de archivos. | RF-20–25, 33; RNF-01–05, 07–09. |
| CU-05 | Lecturas de actividades y mediciones vigentes agrupadas por tres etapas. | RF-26–29, 33; RNF-01–04, 07. Algoritmo/clasificación aún pendientes. |
| CU-06 | Resumen común y captura consistente para vista/PDF; consulta tras cierre. | RF-30–32, 33; RNF-01–03, 06–07. |

Entidades/llaves: [modelo ER](../datos/modelo-entidad-relacion.md) y [diccionario](../datos/diccionario-datos.md). Políticas previstas, transacciones y escenarios de aceptación: [seguridad e integridad](../datos/seguridad-integridad.md). Esta revisión documental no equivale a pruebas de ejecución.

## Cierre aprobado — ADR-002

[ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md) incorpora reglas y ajustes concretos al esquema; [contratos v1](../arquitectura/contratos-v1.md), [catálogos](../producto/catalogo-actividades.md), [diccionario](../datos/diccionario-datos.md) y [seguridad](../datos/seguridad-integridad.md) son fuentes vigentes.

| Acuerdo | CU / RF | RNF y control |
|---|---|---|
| Periodo libre, preselección y alta idempotente con proyecto.version/solicitud/hash. | CU-01; RF-01–07, 33. | RNF-01–05, 07–09; reintento sin duplicados y cierre concurrente. |
| Cuatro métricas en Desarrollo, objetivo_critico de M-01, operandos exactos y captura/revisión completas. | CU-01/02/05/06; RF-03, 08–14, 28–32, 33. | RNF-08–10; original intacto, corrección antigua no desplaza vigente y cero no equivale a ausencia. |
| Criterios de evidencia por actividad, archivo_evidencia y FK evidencia.archivo_id. | CU-03/04; RF-15–25, 33. | RNF-01–03, 08–09; PDF privado, referencias preservadas y limpieza sin carreras. |
| PDF 3 MiB, reserva 30 minutos, limpieza diaria a partir de 24 horas sin referencias; adaptador privilegiado acotado. | CU-04; RF-23–25, 33. | RNF-02–03, 09; llamadas directas no eluden validación, fallos no confirman entregas. |
| Captura cifrada 15 minutos, límites explícitos y autorización al exportar. | CU-06; RF-30–33. | RNF-01–03, 06–07; vista/PDF coinciden y token alterado/expirado/ajeno rechazado. |
| Salud sigue Sin evaluar sin algoritmo ni categorías definitivas. | CU-05/06; RF-26–29, 30–32. | Conserva alcance pendiente; no se demuestra cálculo inexistente. |

Las verificaciones anteriores son escenarios exigidos al implementar, no resultados de ejecución. Se conservan los seis CU de doce apartados y diez RNF.

## Implementación local de datos — bootstrap 2026-10-18

El [plan autorizado](../datos/plan-bootstrap-supabase.md) implementa la parte de datos de los acuerdos anteriores. La [guía local](../datos/guia-supabase.md) registra operación y límites de validación; los resultados efectivos se registran al finalizar el bootstrap.

| CU | Implementación de datos | Pendiente fuera de este bootstrap |
|---|---|---|
| CU-01 | RPC de alta/configuración atómica, edición, cierre y consulta; participación y RLS. | Formularios y autorización de rutas Next.js. |
| CU-02 | Objetivos, mediciones idempotentes, revisiones anexadas y consulta de vigencia. | Interfaz y validación Zod de sus formularios. |
| CU-03 | Instancias repetibles, responsable, inicio y estados ligados a entregas/revisiones. | Pantallas y flujos de usuario. |
| CU-04 | Intentos, evidencias, reserva/confirmación/limpieza; adaptador local de servidor y Storage privado. | Endpoint Next.js, sesiones SSR y pruebas de navegador. |
| CU-05 | Resumen consistente general/por etapa y entradas reales de métricas/actividades. | Algoritmo aprobado de salud y dashboard. |
| CU-06 | Resumen reutilizable y consulta de proyectos cerrados. | Captura cifrada, exportación PDF y correspondencia visual. |

Las pruebas de API/BD no sustituyen las pruebas de tiempos extremo a extremo, usabilidad, compatibilidad Chrome/Firefox ni reportes exigidas por los RNF. Este resultado del bootstrap no cambia ningún RF ni acredita por sí mismo los flujos de la aplicación; el avance posterior de CU-01 se detalla a continuación.

## CU-01 implementado — 2026-10-19

Se conservan RF, RNF y reglas aprobadas. [Realización, ejecución y límites](../modulos/cu01-implementacion.md).

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| Sesión y RF-33; RNF-01/02/03 | Auth SSR, perfil verificado, acciones autorizadas, sesión del usuario y RLS. | E2E sesión/logout/renovación, llamadas directas como Miembro/QA ajeno/sin sesión; integración BD existente. |
| SF-01; RF-01–04; RNF-08/09 | Asistente existente, catálogos reales, miembros por búsqueda paginada y crear_proyecto atómico/idempotente. | E2E alta/configuración/etapas/persistencia, validaciones y recuperación tras pérdida de respuesta; unitarias y atomicidad en BD. |
| SF-02; RF-05; RNF-03/08 | Listado autorizado y consulta con participantes/configuración; paginación con cursor validado. | E2E proyecto ajeno/inexistente/malformado y paginación; unitarias de cursor. |
| SF-03; RF-06; RNF-02/08/09 | Editar campos generales con versión esperada, errores y revalidación. | E2E edición, dos pestañas y solicitudes directas rechazadas; unitarias de fechas/campos/versiones. |
| SF-04; RF-07; RNF-02/08/09 | Confirmación de cierre, RPC y consulta conservada en solo lectura. | E2E cancelar/confirmar cierre, consulta como Miembro y rechazo de edición posterior; bloqueo concurrente en BD. |
| RNF-07 (parte CU-01) | UI reutilizada con datos reales. | Escenarios CU-01 aprobados en Chrome Stable/Firefox; no cubre todavía los otros cinco CU. |

RNF-04/05: pendientes mediciones de aceptación en entorno desplegado; las duraciones de las suites locales no sustituyen sus umbrales. CU-02 a CU-06 y el algoritmo de salud mantienen el estado indicado en sus fuentes.

## CU-04 implementado — 2026-10-19

Se conservan RF, RNF y reglas aprobadas. [Realización, ejecución y límites](../modulos/cu04-implementacion.md).

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| Pasos 1–4; RF-20; RF-33; RNF-01/02/03 | Mis actividades con sesión del usuario y RLS: solo actividades asignadas, observaciones de QA e intentos. | E2E lista sin actividades ajenas; acceso de otro miembro y sin sesión rechazados. |
| SF-01; RF-21; RNF-08/09 | `iniciar_actividad` con versión esperada y preparación del intento 1. | E2E iniciar y registrar; proyecto cerrado sin acciones. |
| Pasos 6–9; RF-22–24; FE-02/03/04 | Resultado, enlace y PDF validados en servidor; PDF por Route Handler con origen, 3 MiB, formato básico, reserva/confirmación y compensación; envío atómico. | Unitarias de enlace/PDF/entradas; E2E faltantes, inválidos, adjuntos, envío y persistencia; integración BD existente. |
| SF-02; RF-25; RNF-08/09 | `preparar_entrega` copia resultado y evidencias del intento devuelto; el intento enviado queda inmutable. | E2E devolución, corrección en intento 2 e intento 1 sin cambios. |
| Lectura privada; RNF-03 | GET de PDF autorizado en cada solicitud, adjunto, `no-store` y `nosniff`. | E2E cabeceras y contenido descargado. |
| RNF-07 (parte CU-04) | UI existente con datos reales. | Escenarios CU-04 aprobados en Chrome for Testing y Firefox. |

RNF-04/05: pendientes mediciones en entorno desplegado. La asignación y revisión por QA siguen en CU-03.
