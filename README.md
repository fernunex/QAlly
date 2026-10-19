# QAlly

**QAlly** es una aplicación web para gestionar y monitorear actividades de aseguramiento de la calidad del software (SQA), sus evidencias, métricas de calidad y el estado de salud de proyectos de desarrollo.

Es un proyecto académico orientado principalmente a navegadores de escritorio (Chrome y Firefox).

## Funcionalidades

- **Proyectos:** registro, integrantes, consulta, modificación y cierre con conservación de información.
- **Actividades SQA:** elección desde catálogo, asignación y seguimiento desde Pendiente hasta Aprobada.
- **Evidencias:** entrega de resultados mediante archivos PDF o enlaces y revisión por QA.
- **Métricas:** objetivos/umbrales, nuevas mediciones, historial y correcciones trazables.
- **Estado de salud:** indicadores generales y por etapa del proyecto.
- **Reportes:** consulta del estado actual de calidad y exportación a PDF.

> El algoritmo y las categorías definitivas de salud aún están pendientes de validación. El módulo y sus datos sí forman parte del alcance.

## Roles

| Rol | Funciones principales |
|---|---|
| **QA** | Administra proyectos, métricas y actividades; revisa entregas y genera reportes. |
| **Miembro del equipo** | Consulta proyectos autorizados y ejecuta/entrega actividades asignadas. |

## Stack tecnológico

| Capa | Tecnología seleccionada |
|---|---|
| Lenguaje | TypeScript |
| Aplicación web y lógica del servidor | Next.js (App Router) + React |
| Estilos y componentes | Tailwind CSS + shadcn/ui |
| Datos | PostgreSQL (Supabase), Supabase JS y tipos generados |
| Autenticación y archivos | Supabase Auth + Supabase Storage (privado) |
| Validación | Zod |
| Reportes PDF | `@react-pdf/renderer` |
| Pruebas | Vitest + Playwright |
| Convenciones y CI | ESLint + Prettier + GitHub Actions |
| Despliegue | Vercel + Supabase |
| Paquetes | npm |

Arquitectura: **monolito modular en un solo repositorio**. La lista de tecnologías está aprobada; versiones de UI y datos se fijan en package-lock.json.

## Entorno de base de datos local

Requisitos: Node.js 24 y Docker funcionando. Herramientas con versiones fijadas en package-lock.json; sin instalaciones globales.

```sh
npm ci
npm run db:start
npm run db:seed
npm run db:types
npm run db:lint
npm run db:test
npm run typecheck
```

Supabase Studio: **http://127.0.0.1:54323**. El arranque genera `.env.local` sin mostrar credenciales. Los seeds crean seis cuentas ficticias y tres proyectos; contraseña aleatoria únicamente en ese archivo local. No hay cuenta/proyecto de Cloud enlazado. La UI Next.js está integrada y todavía utiliza datos y sesión de demostración; los casos de uso se conectarán progresivamente a Supabase.

Para parar conservando datos: `npm run db:stop`. Reconstruir la base borra datos locales y exige `npm run db:reset -- --confirm-local-reset`; después ejecutar el seed. Dataset grande opcional: `npm run db:seed:large`. Limpieza administrativa de archivos: `npm run db:cleanup`.

[Guía de Supabase](docs/datos/guia-supabase.md): conceptos, datos iniciales, seguridad, scripts, pruebas y conexión futura a Cloud. No versionar credenciales reales ni ejecutar seeds/reset de desarrollo contra un proyecto remoto.

## Ejecutar la interfaz y trabajar en equipo

```sh
npm run dev -- --hostname 127.0.0.1
```

Abrir http://127.0.0.1:3000. La UI de demostración permite entrar con `david@equipo.dev` (QA) o `emi@equipo.dev` (Miembro) y cualquier contraseña no vacía; no usa las cuentas reales del seed ni persiste los cambios en PostgreSQL. Al implementar cada caso de uso se reemplazarán su sesión/consultas simuladas por autenticación y operaciones reales del servidor.

Validar la aplicación con `npm run lint`, `npm run typecheck` y `npm run build`; validar la base con los comandos anteriores. `typecheck` genera primero los tipos de rutas Next.js para funcionar desde una instalación limpia.

`dev` reúne la base de UI y BD; desarrollar funcionalidades en ramas creadas desde `dev`, revisar mediante PR hacia `dev` y promover versiones verificadas a `main`. [Flujo y registro de integración](docs/equipo/integracion-ui-bd.md).

## Documentación

- [Índice de documentación](docs/indice.md)
- [Requerimientos funcionales](docs/requisitos/funcionales.md)
- [Requerimientos no funcionales](docs/requisitos/no-funcionales.md)
- [Casos de uso](docs/requisitos/casos-uso/)
- [Reglas de negocio](docs/producto/reglas-globales.md)
- [Catálogo de actividades v1 aprobado](docs/producto/catalogo-actividades.md)
- [Catálogo de métricas v1 aprobado](docs/producto/catalogo-metricas.md)
- [Tecnologías seleccionadas](docs/arquitectura/stack-aprobado.md)
- [Diseño arquitectural y C4](docs/arquitectura/diseno-arquitectural.md)
- [Modelo de datos](docs/datos/modelo-entidad-relacion.md)
- [Decisión de diseño aprobada](docs/decisiones/ADR-001-diseno-tecnico-v1.md)
- [Cierre de diseño aprobado — ADR-002](docs/decisiones/ADR-002-cierre-diseno-v1.md)
- [Contratos internos v1](docs/arquitectura/contratos-v1.md)
- [Decisiones pendientes](docs/decisiones/pendientes.md)

## Contribución y calidad

Los cambios se trabajarán mediante ramas y pull requests con revisión de pares. El equipo documentará verificaciones y evidencias SQA de acuerdo con su [estrategia de aseguramiento de calidad](docs/equipo/sqa-en-el-desarrollo.md).
