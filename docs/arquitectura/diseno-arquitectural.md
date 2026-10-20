# Diseño arquitectural de QAlly

**Estado: APROBADO para documentación, 2026-10-18.** La aprobación del usuario comprende la propuesta arquitectónica y conceptual de datos, rol global con participación por proyecto, entregas enviadas inmutables, orden temporal de mediciones, campos generales y cierre en solo lectura. No autoriza código, migraciones ejecutables, cambios en Supabase, dependencias o despliegue. [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md) y [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md), que aprueba el cierre de diseño salvo salud.

**Actualización de ejecución — 2026-10-19:** las autorizaciones posteriores permitieron implementar el [bootstrap local de BD](../datos/guia-supabase.md), integrar la UI y completar [CU-01 con sesión real](../modulos/cu01-implementacion.md). Las restricciones del párrafo anterior describen el alcance de la aprobación inicial. Se mantiene este diseño; CU-02/03/04 se incorporan en la [integración conjunta](../equipo/integracion-cu02-cu03-cu04.md). CU-05/06, Cloud y despliegue siguen pendientes.

## Objetivo y decisiones

Una aplicación Next.js App Router con React y TypeScript concentra interfaz y servidor, organizada por funcionalidades. Supabase aporta identidad, PostgreSQL y Storage privado. Vercel aloja la aplicación. El equipo de cinco estudiantes puede trabajar por módulo compartiendo permisos, consultas y contratos sin mantener servicios independientes.

El stack aprobado no cambia: Supabase JS y tipos generados, Zod, Tailwind CSS/shadcn/ui, `@react-pdf/renderer`, Vitest/Playwright, ESLint/Prettier/GitHub Actions y npm. No se incorpora ORM, backend separado, cola ni caché externa.

| Decisión | Alternativa considerada | Motivo y consecuencia |
|---|---|---|
| Un monolito modular | Frontend/backend o microservicios separados | Menos coordinación y despliegues; exige respetar las responsabilidades internas. |
| Rol global y pertenencia explícita | Rol diferente en cada proyecto | Simplifica alta y permisos; QA necesita participación para proyectos existentes. No permite cambiar de rol por proyecto. |
| Catálogos separados de instancias | Copiar tipos como texto o codificarlos en enums | Permite repetición de actividades, unicidad de métricas y actualización controlada de catálogos versionados. |
| Entregas enviadas inmutables por intento | Sobrescribir resultado/evidencia | Conserva qué revisó QA; un reenvío crea otro intento. |
| Mediciones con revisiones anexadas | UPDATE destructivo o tratar corrección como nueva medición | Conserva el original y evita que corregir un dato antiguo lo convierta en actual. |
| Salud calculada desde entradas persistidas | Guardar puntajes/clasificaciones supuestas | Mantiene general y tres etapas sin inventar algoritmo; actualmente Sin evaluar. |
| Reporte actual bajo demanda | Histórico de reportes y PDF persistentes | Cumple CU-06 sin ampliar alcance; vista y PDF comparten captura. |
| Proyecto cerrado de solo lectura | Excepciones de edición o reapertura | Regla sencilla y verificable; conserva consultas y reportes. |

## Documentos del diseño

| Documento | Contenido canónico |
|---|---|
| [C4-01](C4-01-contexto.md) | Personas, QAlly y dependencia Supabase. |
| [C4-02](C4-02-contenedores.md) | Aplicación, Auth, PostgreSQL y Storage; comunicaciones y despliegue. |
| [C4-03](C4-03-componentes.md) | Responsabilidades internas, dependencias, interfaces conceptuales y matriz componentes–CU. |
| [Modelo ER](../datos/modelo-entidad-relacion.md) | Entidades, cardinalidades, llaves, unicidades y consultas vigentes. |
| [Diccionario](../datos/diccionario-datos.md) | Atributos, tipos previstos, nulabilidad y reglas. |
| [Seguridad e integridad](../datos/seguridad-integridad.md) | Permisos, RLS, transacciones, archivos, concurrencia y escenarios RNF. |

## Lecturas compartidas y límites

Las entradas de servidor validan formato; los módulos verifican permisos y reglas. El adaptador ejecuta consultas o una RPC transaccional cuando la operación requiere varias escrituras. Las restricciones y controles de BD impiden que una solicitud directa eluda invariantes.

Proyectos orquesta el alta completa sin invocar altas parciales ya confirmadas. Actividades es propietario de las transiciones; Evidencias coordina archivos y envío sin escribir estados por separado. Métricas es propietario del orden temporal y correcciones. Salud consume lecturas compartidas; Reportes usa ese resumen y exige QA.

La interfaz visual no calcula reglas independientes. No hay una API interna de red entre módulos. La [estructura de carpetas propuesta](estructura-repo-propuesta.md) sigue siendo orientativa; estos componentes no obligan a una carpeta o clase por componente.

## Proyecto, salud y datos iniciales

Campos generales acordados: nombre, descripción y fecha de inicio obligatorios; periodo académico y fecha de finalización prevista opcionales. Fin previsto no precede al inicio. Identidad, autores, creación, actualización y cierre son automáticos. Periodo informativo sin unicidad. No se añade un flujo de reapertura ni gestión posterior de cuentas.

El resumen de calidad incluye proyecto y fecha, tres etapas, actividades por estado, métricas con objetivos y revisiones vigentes, cumplimiento calculable y datos ausentes/no evaluables. La salud general y por etapa indica Sin evaluar mientras no exista algoritmo aprobado. No se introducen pesos ni categorías definitivas, tampoco se considera ausencia igual a cero.

## Plan documental de migraciones y semillas

El plan de diseño siguiente se realizó en `supabase/migrations/` y los scripts locales; véase la [guía Supabase](../datos/guia-supabase.md). La enumeración expresa responsabilidades, no nombres de archivos:

1. Perfiles y base de autorización; cuentas mediante Auth, no inserciones manuales en sus tablas internas.
2. Etapas definitivas y estructura de catálogos.
3. Proyectos, participaciones y configuración por proyecto.
4. Actividades, entregas, archivos físicos, referencias de evidencia y revisiones QA.
5. Mediciones y revisiones de datos.
6. Restricciones, índices, funciones y políticas de tablas/Storage. En cada migración expuesta, proteger tablas desde su creación; esta lista no autoriza dejarlas temporalmente públicas.
7. Semillas con identificadores estables y datos de prueba separados de cuentas reales.

Las tres etapas se pueden sembrar definitivamente. Catálogos v1 aprobados: A-01..A-10 con cinco preselecciones, M-01..M-04 en Desarrollo, fuentes y fórmulas documentadas y objetivos iniciales configurables. No sustituir estas definiciones por supuestos. Semillas no eliminan ni reclasifican datos usados sin migración revisada.

## Estado de los acuerdos y supuestos

Los supuestos S1, S2 y S3 de la propuesta fueron aceptados por el usuario: rol global, intentos inmutables y vigencia por fecha de medición con desempate estable. Se documentan como decisiones aprobadas, no como hechos anteriores a la aprobación. También se aceptaron campos generales revisables y cierre de solo lectura.

ADR-002 cierra catálogos, periodo informativo, límites/validación/limpieza, interfaces v1 y ajustes concretos de datos. PENDIENTE de diseño de producto: algoritmo y clasificación de salud. La autorización inicial no comprendía implementación; el bootstrap, la integración y CU-01 se ejecutaron con autorización posterior registrada en [decisiones](../decisiones/registro.md). La ratificación académica independiente no se presume.

## Validación documental del diseño

| CU / RF | Correspondencia C3–datos | RNF y comprobación futura |
|---|---|---|
| CU-01 / RF-01–07, 33 | Proyectos; proyecto y participación; configuración inicial en catálogos/instancias. Campos definidos y cierre conservando consulta. | 01–05, 07–09: autorización, persistencia, alta atómica y cierre concurrente. |
| CU-02 / RF-08–14, 33 | Métricas; unicidad de tipo, medición y revisiones, objetivo actual. | 01–05, 07–10: correcciones completas, medición vigente estable y no duplicación. |
| CU-03 / RF-15–19, 33 | Actividades; instancia repetible, responsable del proyecto y revisión QA. | 01–05, 07–09: transiciones, asignación y decisión atómica. |
| CU-04 / RF-20–25, 33 | Evidencias + Actividades; entrega por intento, PDF privado o enlace. | 01–05, 07–09: responsable, envío completo y fallos Storage/SQL. |
| CU-05 / RF-26–29, 33 | Salud consume actividades y últimas revisiones por etapa. | 01–04, 07: acceso y consultas; RF-26 y clasificación final de RF-27 pendientes del algoritmo. |
| CU-06 / RF-30–32, 33 | Reportes consume la misma captura de resumen; sin tabla de histórico. | 01–03, 06–07: QA, coherencia vista/PDF y descarga en navegadores. |

Revisión de coherencia: C1 sitúa Supabase externo; C2 abre sus servicios y la aplicación única; C3 abre solo esa aplicación y mantiene las mismas dependencias externas. Todas las entidades tienen propietario funcional y los seis CU tienen correspondencia. No se inventan fórmulas ni integraciones. La matriz amplía [trazabilidad](../requisitos/trazabilidad.md) sin cambiar sus IDs.

Esta matriz valida el diseño. CU-01 a CU-04 se integraron después en `dev` y se verificaron conjuntamente con BD/RLS y Chrome estable/Firefox; los [resultados y límites](../equipo/integracion-cu02-cu03-cu04.md) delimitan la evidencia disponible. CU-05/06, la paginación de CU-04 y las muestras RNF en entorno desplegado siguen pendientes.

## Cierre de diseño v1 — ADR-002

- [Contratos v1](contratos-v1.md): entradas, salidas, errores, versiones, idempotencia y captura cifrada del reporte.
- [Detalle técnico](../datos/detalle-tecnico-v1.md): límites, precisión y restricciones; [seguridad](../datos/seguridad-integridad.md): privilegios, RPC, protocolo de archivos y bloqueos.
- Delta incorporado al ER/diccionario: tabla `archivo_evidencia`; `evidencia.archivo_id` en lugar de metadata duplicada; proyecto con versión/solicitud/hash; métrica con objetivo crítico y sin objetivo superior.
- PDF hasta 3 MiB; reserva de 30 minutos; limpieza administrativa diaria después de 24 horas sin referencias; reporte con captura de 15 minutos y cotas explícitas. No se modifica stack ni se agrega un servicio.

La validación documental debe contrastar estos cambios con los seis CU y diez RNF. Seguridad, rendimiento, concurrencia y compatibilidad siguen requiriendo las pruebas de ejecución especificadas; no se consideran superadas por la aprobación del diseño.
