# Registro de decisiones

| ID interno de la memoria | Estado | Decisión / motivo | Impacto |
|---|---|---|---|
| DEC-01 | **ACORDADO** | Alcance reducido y demostrable por equipo de cinco estudiantes, sin sobreingeniería. | Evitar módulos e integraciones no esenciales. |
| DEC-02 | **ACORDADO** | Roles QA y Miembro; no rol PM dentro del producto. | Permisos y actores CU. |
| DEC-03 | **ACORDADO** | Login como precondición; usuarios iniciales por script/BD. | No añadir CU de alta de usuario a esta versión. |
| DEC-04 | **ACORDADO** | Tres etapas fijas; cada tipo de catálogo tiene etapa predefinida. | Organización y salud por etapa. |
| DEC-05 | **ACORDADO** | Catálogos cerrados; no alta de nuevos tipos arbitrarios por usuarios. | CU-01/02/03; simplifica capturas. |
| DEC-06 | **PRECISADA POR DEC-25 (2026-10-30)** | Actividades iniciales preseleccionadas pero editables; solo se crean las elegidas. La preselección posterior de cinco de ADR-002 queda SUPERADA por diez. | CU-01; se conserva la selección editable. |
| DEC-07 | **ACORDADO** | Puede repetirse actividad tipo en proyecto; métrica tipo no se duplica. | Modelo de datos y validaciones. |
| DEC-08 | **ACORDADO** | Actividad: Pendiente → En progreso → En revisión → Aprobada o devuelta a En progreso. | CU-03/04. |
| DEC-09 | **ACORDADO** | Inicio explícito solo por miembro asignado; QA aprueba/devuelve con observaciones. | Autorización y trazabilidad. |
| DEC-10 | **ACORDADO** | Evidencia PDF o enlace; resultado obligatorio; en revisión no hay edición ordinaria. | CU-04. |
| DEC-11 | **ACORDADO** | Mediciones históricas; corrección auditable; última vigente para cumplimiento actual. | CU-02, integridad. |
| DEC-12 | **RESUELTA POR DEC-27 (2026-10-30)** | Se conserva salud general y por etapa; la mención histórica de fórmula pendiente queda SUPERADA. | CU-05/06, RF-26/27/29. |
| DEC-13 | **ACORDADO** | Reporte actual en pantalla + PDF, sin historial de versiones del reporte. | CU-06. |
| DEC-14 | **ACORDADO** | Cuatro atributos: Seguridad, Rendimiento, Portabilidad, Integridad. | RNF-01 a 10. |
| DEC-15 | **ACORDADO** | Portabilidad solo Chrome y Firefox de escritorio; descartar Edge/RNF redundante. | RNF-07 final. |
| DEC-16 | **ACORDADO** | DER se sustituye en catálogo base por conteo de defectos de severidad alta/crítica abiertos. | Métrica M-04 y carga manual. |
| DEC-17 | **ANTECEDENTE APROBADO; PRECISADO POR DEC-25/26 (2026-10-30)** | Catálogos de diez actividades y cuatro métricas, etapas, capturas, objetivos iniciales, evidencia y criterios QA concretados por ADR-002. | Ratificación académica independiente no presumida. |
| DEC-18 | **RESUELTA POR DEC-27 (2026-10-30)** | Algoritmo, escala, pesos y ausencias aprobados; se conserva la anterior indefinición como antecedente histórico. | Integración técnica y pruebas pendientes; casos residuales en pendientes de requisitos. |
| DEC-19 | **APROBADO (2026-10-18)** | Cierre en solo lectura de negocio; conserva consultas, evidencias y reportes según rol. | Cerrado por ADR-001; sin reapertura ordinaria. |
| DEC-20 | **RESUELTO (2026-10-18)** | Campos por ADR-001; ADR-002 define periodo informativo de hasta 40 caracteres y múltiples proyectos permitidos, sin unicidad. | CU-01 y diccionario. |
| DEC-21 | **APROBADO (2026-10-18)** | Stack Full Stack TypeScript: Next.js App Router + React; Tailwind CSS + shadcn/ui; PostgreSQL, Auth, Storage y Supabase JS de Supabase; Zod; React PDF; Vitest/Playwright; ESLint/Prettier/GitHub Actions; Vercel + Supabase; npm. | Ver `../arquitectura/stack-aprobado.md`. |
| DEC-22 | **APROBADO (2026-10-18)** | Monolito modular en repositorio único; sin ORM Prisma o backend separado como solución inicial. | Diseño arquitectónico y repositorio. |
| DEC-23 | **DISEÑO APROBADO / IMPLEMENTACIÓN PENDIENTE (2026-10-18)** | C4, modelo ER, atributos, permisos y controles transaccionales documentados por ADR-001. ADR-002 cierra límites, interfaces y controles concretos; SQL/código ejecutable y versiones pendientes de bootstrap. | Arquitectura y datos; no autoriza bootstrap ni migraciones ejecutables. |
| DEC-24 | **APROBADO (2026-10-20)** | Los instantes se presentan en hora de la Ciudad de México con zona fija (`America/Mexico_City`), rotulados «hora de CDMX» en salud y reportes; los días de calendario (fechas del proyecto y de medición) no se convierten. Datos y contratos siguen en UTC. | `src/lib/format.ts`; sustituye la presentación en UTC de CU-02 a CU-06. |
| DEC-25 | **APROBADO (2026-10-30)** | Ratificar A-01…A-10 con objetivos y evidencias sugeridas; las diez preseleccionadas y desmarcables, solo las elegidas crean instancias Pendiente. | [Catálogo de actividades](../producto/catalogo-actividades.md); CU-01/03/04, RF-02/04/15–25. Sustituye cinco preselecciones de ADR-002. |
| DEC-26 | **APROBADO (2026-10-30)** | Ratificar M-01…M-04 en Desarrollo, captura manual y fuente opcional; M-01 general separado del criterio 100% crítico; revisión previa por otra persona en M-02 y prueba ejecutada en M-03. | [Catálogo de métricas](../producto/catalogo-metricas.md); CU-01/02/05/06, RF-03/08–14/28–32. Sustituye fuente obligatoria y cumplimiento conjunto de ADR-002. |
| DEC-27 | **APROBADO (2026-10-30)** | Salud con igual peso por instancia/métrica, aporte normalizado, ausencias en denominador y cuatro rangos; advertencias sin tope de puntuación. | [Reglas de salud](../producto/reglas-globales.md#salud-aprobada); CU-05/06, RF-26/27/29. Resuelve DEC-12/18. |
| DEC-28 | **APROBADO (2026-10-30)** | Reporte QA actual: salud general/tres etapas, métricas, actividades/evidencias y advertencias; misma definición/resultados en dashboard, vista y PDF; sin incrustar evidencias ni histórico de PDFs. | [Contenido del reporte](../producto/reglas-globales.md#contenido-del-reporte); CU-06, RF-30/31/32/33; conserva CDMX (DEC-24) y seguridad. |
| DEC-29 | **APROBADO (2026-11-02)** | RQ-01: objetivos porcentuales de M-01/02/03 en (0,100]; una meta 0 % previa cuenta como No evaluable para salud. El objetivo crítico de M-01 admite 0. | [ADR-003](ADR-003-salud-y-reporte.md); CU-01/02/05, RF-10/26/29. |
| DEC-30 | **APROBADO (2026-11-02)** | RQ-02: un nulo técnico en una medición Evaluable o en su objetivo es error de integridad (FE-03 con reintento), no evaluación parcial ni cero. | [ADR-003](ADR-003-salud-y-reporte.md); CU-05/06, RF-26/29. |
| DEC-31 | **APROBADO (2026-11-02)** | RQ-03: el aporte de salud usa el objetivo vigente; sin historial de objetivos. | [ADR-003](ADR-003-salud-y-reporte.md); CU-02/05/06. |

Estos identificadores `DEC-xx` son **solo para consulta en esta memoria** y **no** forman parte de la numeración formal de RF/RNF/CU.

**Instrucción de mantenimiento:** este registro es una fotografía de acuerdos previos, no una aprobación automática de propuestas. Para nuevas decisiones usar entradas `ADR-...` o fecha + decisión + alternativas + motivo + documentos afectados. No confundir los ID DEC-xx con identificadores del SRS.

## Decisiones posteriores

Las descripciones de ADR-001/002 reflejan su fecha original; las reglas funcionales en conflicto quedan sustituidas por DEC-25–28. Sus decisiones técnicas conservan vigencia hasta revisión del equipo; no se reescriben retrospectivamente los ADR.

| ADR | Fecha | Estado | Decisión y alcance |
|---|---|---|---|
| [ADR-001 — Diseño técnico inicial](ADR-001-diseno-tecnico-v1.md) | 2026-10-18 | **APROBADO** | Documentación C1–C3 y datos; rol global + proyecto, entregas inmutables, mediciones con revisiones, campos generales y cierre de solo lectura. Catálogos/salud siguen abiertos. Sin implementación. |
| [ADR-002 — Cierre de diseño v1](ADR-002-cierre-diseno-v1.md) | 2026-10-18 | **APROBADO** | Catálogos, periodo, PDF/limpieza, contratos y ajustes de esquema: archivo físico, idempotencia/versión de proyecto y objetivo crítico. Salud sigue pendiente. Sin implementación. |

## Ejecución autorizada del bootstrap — 2026-10-18

El usuario solicitó «Realiza el plan completamente» tras la propuesta y precisó «Todavía no; completa primero el entorno local» respecto a Cloud. Se implementó el [plan de datos](../datos/plan-bootstrap-supabase.md) conforme a ADR-001/002, sin cambiar arquitectura ni esquema aprobado. Herramientas fijadas en [stack](../arquitectura/stack-aprobado.md), SQL en `supabase/migrations/`, operación en [guía](../datos/guia-supabase.md).

Se eligió validar primero con CLI/Docker local para reproducir Auth, RLS y Storage sin depender de cuentas remotas; la alternativa de empezar directamente en Cloud queda pospuesta por el usuario. Los catálogos se aplican como migración de referencia y los ejemplos mediante Auth Admin API/script separado, evitando llevar cuentas ficticias al despliegue. Resultado: reconstrucción y veinte pruebas de integración aprobadas; salud y aplicación web pendientes. Esta autorización posterior reemplaza únicamente la restricción histórica de no implementar durante el diseño, sin extenderla a push ni despliegue.

## Integración autorizada de UI y BD — 2026-10-19

El usuario solicitó ejecutar el plan de integración para reutilizar la UI existente y la base local al implementar el backend de cada caso de uso. Se reúnen las historias de `feat/ui-base` y `base/supabase-bootstrap` en una rama de integración, se valida su configuración conjunta y se incorpora a `dev`; `main` permanece estable. La alternativa de desarrollar CU-01 sobre una sola base retrasaba la detección de conflictos de dependencias y configuración.

Se mantienen la estructura modular de UI y las migraciones/RLS; TypeScript se unifica en 5.9.3 por compatibilidad con el analizador ESLint de Next.js. [Resultado, flujo del equipo y pendientes de auditoría](../equipo/integracion-ui-bd.md). Sesión y datos UI siguen siendo demo; no se modifican reglas de negocio ni se considera conectado el backend. No incluye push, Cloud ni despliegue.

## Ejecución autorizada de CU-01 — 2026-10-19

Tras revisar el plan, el usuario solicitó «ejecuta el plan completamente». Se reutilizan los componentes de UI y las RPC/RLS aprobadas para autenticar, registrar, consultar, editar y cerrar proyectos. El adaptador SSR oficial gestiona cookies/renovación y cada acción verifica identidad, rol y proyecto; se evita una sesión propia o un cliente privilegiado que eluda RLS. Se ajustan IDs y formas de datos de la UI mediante adaptadores, sin cambiar esquema ni contratos de negocio. Los guardados simulados de otros CU quedan fuera del flujo real hasta conectarlos. [Evidencia local y alcance](../modulos/cu01-implementacion.md). Salud sigue Sin evaluar; no se autoriza ni ejecuta publicación remota.

## Ejecución de CU-03 y ampliación de contrato — 2026-10-19

El usuario solicitó implementar CU-03 en una rama nueva desde `dev`, coherente con el diseño de frontend y de BD. Ante la diferencia entre los filtros del tablero diseñado (etapa y responsable) y el contrato de listarActividades (solo estado y soloMias), el usuario eligió **ampliar el contrato** con filtros opcionales aplicados en servidor, en lugar de filtrar solo lo cargado o quitar los filtros: con 1000 actividades el tablero pagina y el filtrado en cliente daría resultados incompletos. Sin migraciones ni cambios de RLS o reglas de negocio. La descarga autorizada de PDF del contrato §5 se implementa porque la revisión de SF-04 la requiere. [Implementación](../modulos/cu03-implementacion.md). No incluye push ni despliegue remoto.


## Integración autorizada de CU-02/03/04 — 2026-10-19

El usuario aprobó integrar las tres ramas, canceló la ejecución y después solicitó retomarla tras un nuevo fetch. Se conserva la primera integración y se parte del `dev` remoto actualizado, que contiene el alta y la reversión de CU-04. Se reaplica esa reversión para integrar expresamente CU-04 junto con CU-02/03, sin reescribir el historial remoto. Una ruta compartida de PDF conserva autorización de usuario/RLS; la subida privilegiada permanece solo en servidor. No se modifican esquema, contratos ni requisitos; se mantienen los filtros previamente aprobados de CU-03. [Resoluciones, resultados y pendientes](../equipo/integracion-cu02-cu03-cu04.md). No incluye push ni despliegue.

## Integración de CU-05/CU-06 y recorrido de demo — 2026-10-20

El usuario pidió aceptar el PR #7 (CU-06) en `dev`, verificar que estén los seis CU, borrar las ramas residuales (salvo `main`) y dejar la demo sin bugs de integración. El PR apuntaba a `feat/cu05-salud-proyecto`, ya integrada por el PR #6; se redirigió a `dev` y se fusionó (`7e03f57`) tras pasar la batería local. Se borraron las ramas remotas y locales ya contenidas en `dev`. Un recorrido completo QA/Miembro (alta → métricas → asignación → entrega con PDF y enlace → aprobación → salud → reporte y PDF) encontró y corrigió: una revalidación tardía en Mis actividades que podía ocultar un PDF recién adjuntado (origen de la falla intermitente de CI en Firefox), objetivos con ceros de PostgreSQL en Información general y un plural. El usuario aprobó la presentación en hora de CDMX (DEC-24). Sin cambios de esquema, RLS, contratos ni requisitos. Con autorización del usuario se hizo push de las correcciones a `dev`; sin despliegue.

## Cierre funcional — 2026-10-30

**Origen y autorización:** acuerdos expresos del responsable del proyecto ratificados el 30/10/2026, reproducidos en la instrucción «Prompt para Codex — Cierre y actualización modular de requisitos de QAlly». Esta sesión autoriza su actualización documental completa, sin implementación, migraciones, commits, push ni PR.

DEC-25/26 ratifican los catálogos y sustituyen las alternativas históricas de cinco preselecciones, fuente obligatoria y cumplimiento conjunto de M-01. DEC-27 sustituye mantener la salud indefinida: se adopta un cálculo explícito con el mismo peso por elemento y sin promediar etapas. DEC-28 concreta el contenido y coherencia de reporte/evidencias. El motivo es disponer de requisitos funcionales cerrados y utilizables por el equipo, manteniendo catálogo, roles y trazabilidad existentes.

Fuentes vigentes: [reglas globales](../producto/reglas-globales.md), [actividades](../producto/catalogo-actividades.md), [métricas](../producto/catalogo-metricas.md), [RF](../requisitos/funcionales.md), [trazabilidad](../requisitos/trazabilidad.md). No se atribuyen estos acuerdos a ADR-002 ni se presume ratificación académica independiente. Las secciones fechadas anteriores conservan el estado histórico de implementación de su fecha, incluida la salud Sin evaluar; no describen los nuevos requisitos.

**Requisito aprobado ≠ implementación aprobada o probada:** [pendientes y brechas](../requisitos/pendientes-y-brechas.md) distingue las ambigüedades residuales de producto y las tareas derivadas para diseño, BD, implementación y pruebas. Esta decisión no aprueba cambios a contratos, esquema ni arquitectura.

## Integración técnica de DEC-25–31 — 2026-11-02

Encargo del equipo: «refactor de diseño y de implementación con los nuevos cambios» de requisitos, cálculo de salud y exportación del reporte en PDF. Emiliano (emidsm) aprobó en esta sesión las opciones recomendadas para RQ-01/02/03 (DEC-29/30/31) y la entrega en rama local `feat/salud-dec27` con commits, sin push. El diseño técnico está en [ADR-003](ADR-003-salud-y-reporte.md): cálculo en PostgreSQL dentro de `consultar_resumen`, nueva RPC `consultar_salud`, migración de funciones y datos de referencia sin cambios de tablas. Si el responsable del proyecto no ratifica DEC-29–31, revertir solo esa parte de la migración y del DTO. [Plan de pruebas](../equipo/plan-pruebas-dec25-28.md).

