# QAlly — instrucciones para agentes de desarrollo

## Lectura mínima
- Empezar por `docs/indice.md` y abrir **solo** los documentos relevantes para la tarea.
- Para una función: `docs/modulos/<modulo>.md` → CU enlazado → RF/RNF citados. Para cambios transversales: revisar dependencias afectadas.
- No cargar el contexto maestro histórico ni los seis CU indiscriminadamente.
- Fuentes: requisitos y decisiones aprobadas prevalecen sobre resúmenes de módulos; el enunciado académico prevalece en obligaciones del curso.

## Reglas del producto
- Roles: **QA** y **Miembro del equipo**; permisos por rol **y proyecto**.
- Etapas: Especificación de requerimientos, Diseño del software y Desarrollo.
- Actividad SQA: Pendiente → En progreso → En revisión → Aprobada; QA puede devolver a En progreso con observaciones.
- Un tipo de actividad puede repetirse por proyecto; un tipo de métrica, no.
- Salud general y por etapa **requerida**; algoritmo y clasificación **aprobados el 2026-10-30**: [reglas de salud](docs/producto/reglas-globales.md#salud-aprobada); [pendientes y brechas](docs/requisitos/pendientes-y-brechas.md). Catálogos v1 de actividades y métricas **aprobados para esta versión** en ADR-002; no presumir ratificación académica independiente. No inventar cálculos.

## Tecnología y seguridad
- Stack y arquitectura **aprobados**: `docs/arquitectura/stack-aprobado.md` (Next.js/TypeScript, Supabase, Vercel y herramientas asociadas). Monolito modular; no agregar Prisma, backend separado ni servicios nuevos sin justificar y aprobar.
- Validar autorizaciones del lado servidor y aplicar RLS; no exponer secretos ni archivos privados. Cambios de BD mediante migraciones versionadas.

## Forma de trabajo
- Distinguir **APROBADO / PRELIMINAR / PENDIENTE**; antes de modificar arquitectura, esquema, contratos compartidos o requisitos, proponer cambio y pedir aprobación.
- Implementar solo el alcance relevante; ejecutar verificaciones existentes y declarar lo que no pudo probarse.
- Actualizar documento canónico y trazabilidad CU–RF–RNF al aprobarse cambios.
- No hacer `push`, desplegar ni instalar dependencias *fuera del stack aprobado* sin permiso. Para el bootstrap, presentar plan antes de instalar las dependencias aprobadas.
- Documentar en español; usar «actividad SQA» y «Aprobada».

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
