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

Arquitectura: **monolito modular en un solo repositorio**. La lista de tecnologías está aprobada; versiones concretas y configuración final se fijarán durante la inicialización.

## Instalación y ejecución

**Estado actual:** repositorio en preparación. Todavía no se ha validado un proyecto ejecutable; por eso no se publican comandos de arranque ni variables de entorno supuestamente funcionales.

Una vez realizado el bootstrap, este apartado se completará con los pasos verificados para:

1. Instalar los requisitos previos y dependencias.
2. Configurar el entorno desde `.env.example` y las credenciales propias de desarrollo.
3. Preparar el esquema de PostgreSQL con migraciones y datos iniciales.
4. Ejecutar QAlly localmente.
5. Ejecutar lint, pruebas y compilación.

No se deben incluir claves privadas ni credenciales reales en el repositorio.

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
