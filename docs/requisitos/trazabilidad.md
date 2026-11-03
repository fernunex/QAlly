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

## Cierre funcional aprobado — 2026-10-30

La matriz CU–RF–RNF anterior conserva las asociaciones y los 33 RF/diez RNF; no se alteran umbrales de calidad. [DEC-25–28](../decisiones/registro.md#cierre-funcional--2026-10-30) sustituyen únicamente las reglas funcionales anteriores en conflicto; no aprueban cambios a contratos o BD.

| Acuerdo y fuente vigente | CU / RF afectados | RNF y validación derivada |
|---|---|---|
| DEC-25: [catálogo A-01…A-10](../producto/catalogo-actividades.md), diez preseleccionadas, objetivo/descripción/evidencia sugerida; QA decide aprobación. | CU-01/03/04; RF-02/04/15–25, RF-33. | RNF-01–05, 07–09 según CU; solo seleccionadas crean instancias y solo Aprobada aporta a salud. |
| DEC-26: [catálogo M-01…M-04](../producto/catalogo-metricas.md), Desarrollo/manual, fuente opcional y crítico independiente. | CU-01/02/05/06; RF-03/08–14/28–32, RF-33. | RNF-08–10 y seguridad según matriz; fuente ausente no bloquea, correcciones y vigencia se conservan. |
| DEC-27: [fórmula, normalizaciones, ausencias y cuatro rangos](../producto/reglas-globales.md#salud-aprobada). | CU-05/06; RF-26/27/29 y consumidores RF-28/30–32, RF-33. | RNF-01–04, 07 en CU-05; RNF-01–03, 06–07 en CU-06. Ejemplo 68.57% Regular, bordes sin redondeo y advertencias sin tope. |
| DEC-28: [contenido de reporte](../producto/reglas-globales.md#contenido-del-reporte), misma salud/cifras, CDMX y evidencias autorizadas sin incrustar PDF. | CU-06; RF-30/31/32/33, dependencia CU-05 RF-26–29. | RNF-01/02/03/06/07; coherencia captura/vista/PDF y enlaces privados. |

**Requisito aprobado ≠ comportamiento implementado/probado.** [Pendientes y brechas](pendientes-y-brechas.md) vincula ubicaciones reales con incompatibilidades, responsables y escenarios de validación todavía no ejecutados. RQ-01/02/03 son precisiones residuales; el algoritmo no sigue pendiente de aprobación.

## Implementación DEC-25–31 — 2026-11-02

Rama `feat/salud-dec27`, diseño [ADR-003](../decisiones/ADR-003-salud-y-reporte.md); casos y responsables en el [plan de pruebas](../equipo/plan-pruebas-dec25-28.md).

| Decisión / CU | RF / RNF | Realización | Pruebas |
|---|---|---|---|
| DEC-25 · CU-01 | RF-02/04 | Migración marca A-01…A-10 preseleccionadas; catálogo TS con nombres y objetivos ratificados. | RP-01, CW-01, PR-01; BD «catálogos exactos». |
| DEC-26 · CU-02 | RF-11/13/14 | Fuente opcional en Zod, UI y `private.calcular`; M-01 cumple con el valor general y `cumplimientoCritico` aparte. | IA-02, IA-05, PR-02, CW-01. |
| DEC-27/29/30/31 · CU-05 | RF-26–29, 33; RNF-01–04, 07 | `private.salud_json` en `consultar_resumen`; `consultar_salud` para listado/encabezado; aporte por métrica; meta 0 % rechazada; DTO verifica coherencia. | IA-01–06, RP-05, CW-01/02, PR-03, PR-05. |
| DEC-28 · CU-06 | RF-30–33; RNF-01–03, 06–07 | Modelo único vista/PDF con salud, advertencias, aportes, instancia y evidencias del último intento (rutas autorizadas). | IA-07, RP-06, CW-01/02, PR-04, PR-06. |

## Antecedentes históricos de diseño e implementación

Las secciones siguientes conservan los acuerdos y resultados de sus fechas (2026-10-18 a 2026-10-20). Sus menciones a salud pendiente/Sin evaluar, preselección anterior y cumplimiento conjunto son históricas y quedan superadas funcionalmente por el cierre anterior. Los contratos/datos técnicos enlazados conservan brechas por evaluar; las pruebas anteriores no acreditan los requisitos nuevos.

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

[ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md) incorpora reglas y ajustes concretos al esquema; [contratos v1](../arquitectura/contratos-v1.md), [catálogos](../producto/catalogo-actividades.md), [diccionario](../datos/diccionario-datos.md) y [seguridad](../datos/seguridad-integridad.md) fueron las fuentes de ese cierre técnico; ver el cierre funcional posterior y sus brechas para la vigencia actual.

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

El [plan autorizado](../datos/plan-bootstrap-supabase.md) implementó la parte de datos de los acuerdos anteriores. La [guía local](../datos/guia-supabase.md) registra operación y límites de validación. La tabla siguiente muestra también el avance posterior de la aplicación, sin modificar los requisitos.

| CU | Implementación de datos | Aplicación actual / pendiente |
|---|---|---|
| CU-01 | RPC de alta/configuración atómica, edición, cierre y consulta; participación y RLS. | Integrado en `dev`: [CU-01](../modulos/cu01-implementacion.md). |
| CU-02 | Objetivos, mediciones idempotentes, revisiones anexadas y consulta de vigencia. | Implementado el 2026-10-19: [trazabilidad CU–RF–RNF y evidencia](../modulos/cu02-implementacion.md#trazabilidad). |
| CU-03 | Instancias repetibles, responsable, inicio y estados ligados a entregas/revisiones. | Integrado en `dev`: [CU-03](../modulos/cu03-implementacion.md). |
| CU-04 | Intentos, evidencias, reserva/confirmación/limpieza; adaptador local de servidor y Storage privado. | Integrado en `dev`: [CU-04](../modulos/cu04-implementacion.md); paginación pendiente. |
| CU-05 | Resumen consistente general/por etapa y entradas reales de métricas/actividades. | Consulta implementada en `feat/cu05-salud-proyecto`: [CU-05](../modulos/cu05-implementacion.md); algoritmo aprobado de salud pendiente. |
| CU-06 | Resumen reutilizable y consulta de proyectos cerrados. | Implementado en `feat/cu06-reportes`: [CU-06](../modulos/cu06-implementacion.md); captura cifrada, exportación PDF y misma información en vista y PDF, con salud «Sin evaluar». |

Las pruebas de API/BD no sustituyen las pruebas de tiempos extremo a extremo, usabilidad, compatibilidad Chrome/Firefox ni reportes exigidas por los RNF. Este resultado del bootstrap no cambia ningún RF ni acredita por sí mismo los flujos de la aplicación; el avance de CU-01 a CU-04 y su validación conjunta se detallan a continuación.

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

## CU-03 implementado — 2026-10-19

Se conservan RF, RNF y reglas aprobadas; el contrato de listarActividades se amplía con filtros aprobados por el usuario. [Realización, ejecución y límites](../modulos/cu03-implementacion.md).

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| RF-33; RNF-01/02/03 | Acciones con sesión verificada, rol QA, participación y proyecto abierto; RPC y RLS reautorizan. | E2E llamadas directas como Miembro/QA ajeno/sin sesión y proyecto cerrado; integración BD existente. |
| SF-01; RF-16; RNF-08/09 | Alta desde catálogo vigente con descripción, Pendiente sin responsable; tipo repetible. | E2E validación, dos instancias del mismo tipo y persistencia; unitarias de entradas. |
| SF-02; RF-15; RNF-03/04 | Tablero paginado por estado con totales y filtros en servidor; detalle con intentos enviados, evidencias y revisiones; descarga PDF autorizada. | E2E paginación/filtros, detalle y descarga con cabeceras privadas (404 ajeno, 401 sin sesión). |
| SF-03; RF-17; RNF-08/09 | Asignación de Miembro del proyecto con versión esperada; estado sin cambio. | E2E asignación persistente y conflicto entre pestañas sin sobrescritura. |
| SF-04/05; RF-18/19; RNF-08/09 | revisar_entrega con decisión fija por acción; observaciones obligatorias al devolver; FE-03 identificado. | E2E aprobar/devolver, revisión registrada con QA, decisión repetida rechazada; unitarias de observaciones. |
| RNF-07 (parte CU-03) | UI existente conectada a datos reales. | Escenarios CU-03 en Chrome y Firefox de Playwright. |

RNF-04/05: pendientes mediciones de aceptación en entorno desplegado. En las pruebas individuales de CU-03 se prepararon entregas por RPC; la UI de CU-04 ya está conectada y validada en la integración conjunta.

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


## Validación conjunta CU-01 a CU-04

**Estado actual:** integrada en `dev` mediante `8fb64b4`, con ajuste de formato `f82ffd0`. Resultado local registrado: 50 unitarias, 20 de BD y 44 E2E en Chrome estable y Firefox.

La integración conserva los requisitos y la ampliación de filtros aprobada para CU-03. [Registro conjunto](../equipo/integracion-cu02-cu03-cu04.md). Las referencias anteriores a CU-03/CU-04 sin interfaz pertenecen a las verificaciones individuales previas a la integración.

| Flujo / requisito | Verificación integrada |
|---|---|
| RF-07, RF-15–25 y RF-33; RNF-01/02/03/07/08/09 | Recorrido UI con sesiones separadas: QA crea/asigna; Miembro inicia, adjunta PDF y envía; QA devuelve; Miembro corrige en otro intento; QA aprueba y cierra el proyecto; ambos conservan descarga privada y consulta. El intento original permanece intacto. |
| RF-22/24/25; RNF-08/09 | Respuesta de subida perdida después de persistir: recargar recupera una única evidencia; pruebas de fallos del adaptador comprueban compensación de rechazos conocidos y conservación ante confirmación ambigua. |

Los resultados y límites se registran en la guía conjunta. No equivalen a aceptación de CU-05/06 ni a mediciones de rendimiento desplegado.

## CU-05 implementado — 2026-10-20

Se conservan RF, RNF y reglas aprobadas; salud general y por etapa siguen «Sin evaluar» y RF-26 y la clasificación final de RF-27 permanecen pendientes de diseño. [Realización, ejecución y límites](../modulos/cu05-implementacion.md).

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| RF-33; RNF-01/02/03; FE-02 | `consultarResumen` con sesión del usuario sobre `consultar_resumen`; participación exigida en la BD; NO_DISPONIBLE indistinguible. | E2E QA ajeno, Miembro no participante, inexistente, malformado y sin sesión. |
| Flujo principal; RF-28; RNF-07 | Pestaña Salud con resumen general, tres etapas en orden fijo y métricas reales. | E2E QA y Miembro en Chromium y Firefox de Playwright; unitarias de mapeo. |
| FA-01; RF-26/27 (parcial); RF-29 | «Sin evaluar» con motivo, sin puntajes ni categorías; validación literal del estado. | E2E sin categorías; unitarias de rechazo. |
| SF-01, FE-01; RF-28/29 | Valor actual, objetivo, cumplimiento, estado de medición y fecha; Sin medición ≠ 0. | E2E Sin medición, medida y No evaluable. |
| SF-02; RF-28 | Conteos por estado y actividades por etapa con responsable. | E2E conteos y listas por etapa. |
| FE-03; RNF-04 | Error de carga con reintento, sin datos parciales. | Sin E2E (no provocable desde el navegador); RNF-04 pendiente en despliegue. |

## CU-06 implementado — 2026-10-20

Se conservan RF, RNF y reglas aprobadas; la salud del reporte sigue «Sin evaluar» porque RF-26 y la clasificación final de RF-27 permanecen pendientes de diseño. `generarReporte` expone además `emitidaEn` (campo aditivo, pendiente de visto bueno). [Realización, ejecución y límites](../modulos/cu06-implementacion.md).

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| RF-33; RNF-01/02/03 | Acción `generarReporte` y `POST /api/reportes/pdf` con sesión, rol QA y participación verificados en el servidor; `consultar_resumen` con RLS. | Unitarias de la acción; E2E Miembro (pantalla y POST directo), QA ajeno y sin sesión. |
| Flujo principal; RF-30/31; RNF-07 | Pestaña Reportes: Generar/Regenerar y vista con identificación, fecha, métricas, actividades por etapa y salud. | E2E en Chromium y Firefox de Playwright; unitarias del modelo. |
| FA-01; RF-31/32 | «Sin medición» explícito y salud «Sin evaluar» sin categorías. | E2E y unitarias. |
| SF-01; RF-32; RNF-06 | PDF con `@react-pdf/renderer` desde la captura AES-256-GCM de 15 minutos; 1/2/3 MiB; adjunto privado. | Unitarias de captura (tamper, expiración, usuario/proyecto, límite) y de PDF con 1000 actividades; E2E descarga `%PDF`, token alterado/ajeno, origen inválido y cuerpo excesivo. RNF-06 pendiente en despliegue. |
| FE-01, FE-02; captura expirada | Mensajes con reintento; 410 pide regenerar vista y PDF. | E2E con fallos simulados. |
| Regla de proyectos cerrados | Genera y exporta sin modificar datos. | E2E proyecto cerrado. |
