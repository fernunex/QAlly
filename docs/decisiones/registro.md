# Registro de decisiones

| ID interno de la memoria | Estado | Decisión / motivo | Impacto |
|---|---|---|---|
| DEC-01 | **ACORDADO** | Alcance reducido y demostrable por equipo de cinco estudiantes, sin sobreingeniería. | Evitar módulos e integraciones no esenciales. |
| DEC-02 | **ACORDADO** | Roles QA y Miembro; no rol PM dentro del producto. | Permisos y actores CU. |
| DEC-03 | **ACORDADO** | Login como precondición; usuarios iniciales por script/BD. | No añadir CU de alta de usuario a esta versión. |
| DEC-04 | **ACORDADO** | Tres etapas fijas; cada tipo de catálogo tiene etapa predefinida. | Organización y salud por etapa. |
| DEC-05 | **ACORDADO** | Catálogos cerrados; no alta de nuevos tipos arbitrarios por usuarios. | CU-01/02/03; simplifica capturas. |
| DEC-06 | **ACORDADO** | Actividades iniciales preseleccionadas pero editables; solo se crean las elegidas. | CU-01. |
| DEC-07 | **ACORDADO** | Puede repetirse actividad tipo en proyecto; métrica tipo no se duplica. | Modelo de datos y validaciones. |
| DEC-08 | **ACORDADO** | Actividad: Pendiente → En progreso → En revisión → Aprobada o devuelta a En progreso. | CU-03/04. |
| DEC-09 | **ACORDADO** | Inicio explícito solo por miembro asignado; QA aprueba/devuelve con observaciones. | Autorización y trazabilidad. |
| DEC-10 | **ACORDADO** | Evidencia PDF o enlace; resultado obligatorio; en revisión no hay edición ordinaria. | CU-04. |
| DEC-11 | **ACORDADO** | Mediciones históricas; corrección auditable; última vigente para cumplimiento actual. | CU-02, integridad. |
| DEC-12 | **ACORDADO** | Salud general y por etapa; **no** eliminarla; fórmula pendiente. | CU-05/06, RF-26/27. |
| DEC-13 | **ACORDADO** | Reporte actual en pantalla + PDF, sin historial de versiones del reporte. | CU-06. |
| DEC-14 | **ACORDADO** | Cuatro atributos: Seguridad, Rendimiento, Portabilidad, Integridad. | RNF-01 a 10. |
| DEC-15 | **ACORDADO** | Portabilidad solo Chrome y Firefox de escritorio; descartar Edge/RNF redundante. | RNF-07 final. |
| DEC-16 | **ACORDADO** | DER se sustituye en catálogo base por conteo de defectos de severidad alta/crítica abiertos. | Métrica M-04 y carga manual. |
| DEC-17 | **APROBADO PARA V1 (2026-10-18)** | Catálogos de diez actividades y cuatro métricas, etapas, capturas, objetivos iniciales, evidencia y criterios QA concretados por ADR-002. | Ratificación académica independiente no presumida. |
| DEC-18 | **PENDIENTE** | Algoritmo y escala de salud, ponderaciones y ausencias. | Implementar interfaz/indicadores sin inventar puntaje. |
| DEC-19 | **APROBADO (2026-10-18)** | Cierre en solo lectura de negocio; conserva consultas, evidencias y reportes según rol. | Cerrado por ADR-001; sin reapertura ordinaria. |
| DEC-20 | **RESUELTO (2026-10-18)** | Campos por ADR-001; ADR-002 define periodo informativo de hasta 40 caracteres y múltiples proyectos permitidos, sin unicidad. | CU-01 y diccionario. |
| DEC-21 | **APROBADO (2026-10-18)** | Stack Full Stack TypeScript: Next.js App Router + React; Tailwind CSS + shadcn/ui; PostgreSQL, Auth, Storage y Supabase JS de Supabase; Zod; React PDF; Vitest/Playwright; ESLint/Prettier/GitHub Actions; Vercel + Supabase; npm. | Ver `../arquitectura/stack-aprobado.md`. |
| DEC-22 | **APROBADO (2026-10-18)** | Monolito modular en repositorio único; sin ORM Prisma o backend separado como solución inicial. | Diseño arquitectónico y repositorio. |
| DEC-23 | **DISEÑO APROBADO / IMPLEMENTACIÓN PENDIENTE (2026-10-18)** | C4, modelo ER, atributos, permisos y controles transaccionales documentados por ADR-001. ADR-002 cierra límites, interfaces y controles concretos; SQL/código ejecutable y versiones pendientes de bootstrap. | Arquitectura y datos; no autoriza bootstrap ni migraciones ejecutables. |
| DEC-24 | **APROBADO (2026-10-20)** | Los instantes se presentan en hora de la Ciudad de México con zona fija (`America/Mexico_City`), rotulados «hora de CDMX» en salud y reportes; los días de calendario (fechas del proyecto y de medición) no se convierten. Datos y contratos siguen en UTC. | `src/lib/format.ts`; sustituye la presentación en UTC de CU-02 a CU-06. |

Estos identificadores `DEC-xx` son **solo para consulta en esta memoria** y **no** forman parte de la numeración formal de RF/RNF/CU.

**Instrucción de mantenimiento:** este registro es una fotografía de acuerdos previos, no una aprobación automática de propuestas. Para nuevas decisiones usar entradas `ADR-...` o fecha + decisión + alternativas + motivo + documentos afectados. No confundir los ID DEC-xx con identificadores del SRS.

## Decisiones posteriores

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
