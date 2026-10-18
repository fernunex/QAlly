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
| DEC-17 | **PRELIMINAR** | Lista de 10 actividades y 4 métricas del equipo. | Requiere validación del equipo/profesora. |
| DEC-18 | **PENDIENTE** | Algoritmo y escala de salud, ponderaciones y ausencias. | Implementar interfaz/indicadores sin inventar puntaje. |
| DEC-19 | **ACORDADO EN PRINCIPIO** | Proyecto cerrado se conserva consultable, orientado a solo lectura. | Afinar reglas de edición tras cierre. |
| DEC-20 | **PENDIENTE** | Significado de un proyecto por periodo y campos obligatorios. | CU-01. |
| DEC-21 | **APROBADO (2026-10-18)** | Stack Full Stack TypeScript: Next.js App Router + React; Tailwind CSS + shadcn/ui; PostgreSQL, Auth, Storage y Supabase JS de Supabase; Zod; React PDF; Vitest/Playwright; ESLint/Prettier/GitHub Actions; Vercel + Supabase; npm. | Ver `../arquitectura/stack-aprobado.md`. |
| DEC-22 | **APROBADO (2026-10-18)** | Monolito modular en repositorio único; sin ORM Prisma o backend separado como solución inicial. | Diseño arquitectónico y repositorio. |
| DEC-23 | **PENDIENTE** | Diseño ER, RLS, Storage, transacciones, versiones de dependencias y contratos de módulos. | Arquitectura y datos; no contradice la aprobación del stack. |

Estos identificadores `DEC-xx` son **solo para consulta en esta memoria** y **no** forman parte de la numeración formal de RF/RNF/CU.

**Instrucción de mantenimiento:** este registro es una fotografía de acuerdos previos, no una aprobación automática de propuestas. Para nuevas decisiones usar entradas `ADR-...` o fecha + decisión + alternativas + motivo + documentos afectados. No confundir los ID DEC-xx con identificadores del SRS.
