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
