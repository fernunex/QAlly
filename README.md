# QAlly

QAlly es una plataforma web académica para gestionar actividades de aseguramiento de la calidad del software (SQA), evidencias y métricas de proyectos. Utiliza un **monolito modular con Next.js y Supabase**, con permisos por rol y proyecto.

## Estado actual

**CU-01 a CU-06 están implementados e integrados en `dev`**, con persistencia en Supabase local. CU-02 a CU-04 se integraron en `8fb64b4` (ajuste de formato en `f82ffd0`); CU-05 en el PR #6 (`c70177c`) y CU-06 en el PR #7 (`7e03f57`). `main` conserva una versión anterior y no contiene esta integración.

| Caso de uso | Disponible actualmente | Estado |
|---|---|---|
| [CU-01 — Proyectos](docs/modulos/cu01-implementacion.md) | Alta con miembros y configuración inicial, consulta, edición y cierre conservando datos. | Implementado y probado localmente. |
| [CU-02 — Métricas](docs/modulos/cu02-implementacion.md) | Agregar tipos del catálogo, configurar objetivos, registrar mediciones, consultar historial y corregir con trazabilidad. | Implementado y probado localmente. |
| [CU-03 — Actividades SQA](docs/modulos/cu03-implementacion.md) | Tablero paginado con filtros, alta, asignación, consulta, aprobación y devolución con observaciones. | Implementado y probado localmente. |
| [CU-04 — Entrega de evidencias](docs/modulos/cu04-implementacion.md) | Mis actividades, inicio, resultado, PDF/enlaces, envío a revisión y corrección en otro intento. | Implementado y probado; paginación de listas e intentos pendiente. |
| [CU-05 — Salud del proyecto](docs/modulos/cu05-implementacion.md) | Pestaña Salud: salud general y por etapa «Sin evaluar», tres etapas con conteos y actividades, métricas con valor, objetivo, cumplimiento y «Sin medición». | Consulta implementada y probada localmente; adecuación al algoritmo aprobado el 2026-10-30 pendiente. |
| [CU-06 — Reportes](docs/modulos/cu06-implementacion.md) | Pestaña Reportes (solo QA): generar y regenerar el reporte con métricas, actividades SQA por etapa y salud «Sin evaluar»; exportar a PDF desde una captura cifrada de 15 minutos. | Implementado y probado localmente; adecuación de salud y contenido al cierre funcional pendiente. |

La salud general y por etapa tiene [algoritmo y clasificación aprobados](docs/producto/reglas-globales.md#salud-aprobada) desde el 2026-10-30. La implementación actual aún muestra «Sin evaluar»; [pendientes y brechas](docs/requisitos/pendientes-y-brechas.md) distingue requisitos aprobados de integración y pruebas pendientes. **Supabase Cloud y el despliegue aún no están configurados**; se puede desarrollar y probar localmente.

[Registro de integración y pruebas conjuntas](docs/equipo/integracion-cu02-cu03-cu04.md) · [Pendientes actuales](docs/decisiones/pendientes.md).

## Roles y flujo disponible

- **QA:** crea y administra sus proyectos, configura métricas, registra/corrige mediciones, asigna actividades SQA, revisa entregas y genera/exporta reportes de calidad (también de proyectos cerrados).
- **Miembro del equipo:** consulta proyectos autorizados y su salud, e inicia y entrega sus actividades asignadas desde **Mis actividades**.

Flujo de actividad SQA: **Pendiente → En progreso → En revisión → Aprobada**. QA puede devolver una entrega de En revisión a En progreso con observaciones; la corrección conserva el intento anterior. Los proyectos cerrados siguen disponibles para consulta y descarga de evidencias, con escrituras de negocio bloqueadas.

## Stack tecnológico

| Responsabilidad | Implementación actual |
|---|---|
| Aplicación y servidor | Next.js 16.4.2, React 19.3.0 y TypeScript 5.9.3. |
| Interfaz | Tailwind CSS 4 y shadcn/ui. |
| Datos | PostgreSQL 17 en Supabase local; Supabase JS y tipos generados, sin ORM. |
| Identidad y archivos | Supabase Auth con sesiones SSR y Supabase Storage privado. |
| Validación | Zod; autorización en servidor y RLS en PostgreSQL. |
| Reportes PDF | `@react-pdf/renderer` 4.9.0 en el servidor (Node.js), sin fuentes ni recursos externos. |
| Pruebas y calidad | Vitest, Playwright, ESLint y workflows de GitHub Actions. |
| Herramientas locales | Node.js 24, npm y Docker; versiones reproducibles con package-lock.json. |

`@react-pdf/renderer`, aprobado en el [stack](docs/arquitectura/stack-aprobado.md), ya está incorporado para CU-06. Vercel sigue pendiente de configuración. Prettier está aprobado como herramienta de formato, sin configuración/dependencia propia incorporada al proyecto.

## Primera ejecución local

Requisitos: **Node.js 24 y Docker funcionando**. Desde un checkout de `dev`, ejecutar:

```sh
npm ci
npm run db:start
npm run db:seed
npm run dev -- --hostname 127.0.0.1
```

| Servicio | Dirección |
|---|---|
| Aplicación | http://127.0.0.1:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| API Supabase local | http://127.0.0.1:54321 |

`db:start` inicia los servicios locales y genera `.env.local` sin imprimir credenciales, incluida `REPORT_SNAPSHOT_KEY_BASE64` (clave aleatoria de 32 bytes, solo de servidor, para cifrar la captura de reportes; se crea si falta y se conserva si existe). `db:seed` prepara **dos cuentas QA, cuatro de Miembro del equipo y tres proyectos ficticios**. Los catálogos se instalan mediante las migraciones. No se requiere una cuenta ni un proyecto de Supabase Cloud.

Entrar con `qa1@qally.example.test` o `miembro1@qally.example.test`. La contraseña es el valor de `QALLY_DEV_PASSWORD` de `.env.local`. El acceso utiliza Supabase Auth real; no hay registro público ni selector de rol. El archivo de entorno está ignorado por Git: no compartir contraseñas, sesiones ni claves privilegiadas.

Para recorrer ambos roles, abrir sesiones separadas: QA administra desde **Proyectos → Métricas / Actividades**; el Miembro entrega desde **Mis actividades**. Las cuentas y asignaciones iniciales se describen en la [guía de Supabase](docs/datos/guia-supabase.md#qué-contiene-el-seed).

En los arranques siguientes basta con `npm run db:start` y `npm run dev -- --hostname 127.0.0.1`. `db:start` también aplica las migraciones pendientes a la base local, incluso si Supabase ya está iniciado. Ejecutarlo después de actualizar `dev` mantiene la BD compatible con el código; no se necesita reconstruirla.

## Operación de la base local

| Comando | Uso |
|---|---|
| `npm run db:status` | Consultar direcciones de servicios sin mostrar claves. |
| `npm run db:stop` | Detener Supabase conservando datos. |
| `npm run db:types` | Regenerar tipos TypeScript desde la BD local. |
| `npm run db:seed:large` | Ampliar el dataset de desarrollo para pruebas con volumen. |
| `npm run db:seed:team` | Copiar el proyecto QAlly del equipo, con actividades SQA, mediciones, entregas y PDF, sin sobrescribir una copia existente. |
| `npm run db:cleanup` | Limpiar archivos elegibles sin referencias conforme al protocolo aprobado. |

`npm run db:reset -- --confirm-local-reset` **borra la base local** y aplica de nuevo las migraciones; después requiere `npm run db:seed`. Usarlo solo cuando se quiera reconstruir expresamente el entorno. Los cambios de esquema se realizan con nuevas migraciones versionadas, no editando manualmente Studio como fuente de verdad.

[Guía de datos, seguridad, seeds y futura conexión a Cloud](docs/datos/guia-supabase.md).

Para trabajar con el proyecto **QAlly** que registró el equipo, ejecutar `npm run db:start` y `npm run db:seed:team`. Cada integrante obtiene una copia independiente con acceso para `qa1`, `miembro1` y `miembro2` (`@qally.example.test`); la contraseña es la de su propio `.env.local`. [Contenido de la captura y funcionamiento](docs/datos/guia-supabase.md#copiar-el-proyecto-qally-del-equipo).

## Verificaciones

Con Supabase local iniciado:

```sh
npm run unit:test
npm run db:lint
npm run db:test
npm run typecheck
npm run lint
npm run build
```

Para las pruebas de navegador:

```sh
npx playwright install chromium firefox
npm run e2e:test
```

E2E compila y sirve la aplicación de producción en el **puerto 3100**, que debe estar libre. Añade datos ficticios locales y no borra los existentes. Para utilizar un Chrome estable instalado, definir `QALLY_CHROME_PATH` con la ruta de su ejecutable; el navegador predeterminado de Playwright no se considera automáticamente el canal estable.

La integración de CU-01 a CU-04 verificó **50 pruebas unitarias, 20 de BD y 44 escenarios E2E** en Chrome for Testing Stable 155.0.8059.84 y Firefox de Playwright 157.0. También pasaron lint, TypeScript y build, sin cambios de migraciones ni tipos generados. Son resultados locales registrados, no una nueva ejecución ni una certificación completa de todos los RNF. [Entorno, resultados y límites](docs/equipo/integracion-cu02-cu03-cu04.md#resultados-de-la-integración). La rama de CU-05 registró después **54 unitarias, 20 de BD y 50 E2E** con Chromium y Firefox de Playwright: [resultados de CU-05](docs/modulos/cu05-implementacion.md#resultado-comprobado). La rama de CU-06 registró **67 unitarias, 20 de BD y 60 E2E**: [resultados de CU-06](docs/modulos/cu06-implementacion.md#resultado-comprobado).

## Pendientes relevantes

- Paginar **Mis actividades** y los intentos de CU-04: hoy carga listas completas, con riesgo de respuestas grandes o truncadas por el límite de PostgREST.
- Adecuar CU-01/02/05/06 a los [requisitos aprobados el 2026-10-30](docs/requisitos/pendientes-y-brechas.md): preselección de diez, fuente opcional, criterio crítico independiente, salud y reporte.
- Medir los tiempos de aceptación RNF en un entorno desplegado y representativo.
- Preparar Cloud/despliegue y automatizar la limpieza diaria cuando corresponda. La ejecución remota de GitHub Actions no está acreditada por las pruebas locales.
- Dar seguimiento a los avisos de dependencias registrados durante la integración, sin aplicar actualizaciones forzadas de versiones principales.

## Trabajo en equipo y documentación

Crear ramas de funcionalidad desde `dev`, revisar mediante PR hacia `dev` y promover versiones verificadas a `main`. [Flujo de colaboración](docs/equipo/integracion-ui-bd.md#flujo-para-el-equipo).

- [Índice y fuentes canónicas](docs/indice.md).
- [Diagramas Mermaid: arquitectura, secuencias CU-01 a CU-04 y ER Chen](docs/diagramas/README.md).
- [Requisitos funcionales](docs/requisitos/funcionales.md), [RNF](docs/requisitos/no-funcionales.md) y [trazabilidad](docs/requisitos/trazabilidad.md).
- [Reglas del producto](docs/producto/reglas-globales.md) y catálogos aprobados de [actividades](docs/producto/catalogo-actividades.md) y [métricas](docs/producto/catalogo-metricas.md).
- [Arquitectura C4](docs/arquitectura/diseno-arquitectural.md), [modelo de datos](docs/datos/modelo-entidad-relacion.md) y [contratos internos](docs/arquitectura/contratos-v1.md).
- [Decisiones aprobadas](docs/decisiones/registro.md), [pendientes](docs/decisiones/pendientes.md) y [estrategia SQA](docs/equipo/sqa-en-el-desarrollo.md).
