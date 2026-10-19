# Stack y estilo arquitectónico aprobados — 2026-10-18

**Estado: APROBADO por el PM tras revisar la propuesta técnica.** Esta es la fuente canónica del stack. El bootstrap de datos autorizado posteriormente se registra al final; no implica que la aplicación Next.js esté implementada.

| Responsabilidad | Selección aprobada | Razón aplicada a QAlly |
|---|---|---|
| Lenguaje | **TypeScript** | Tipado compartido y menor costo de coordinación. |
| Frontend + backend | **Next.js (App Router) + React** | Una aplicación para interfaz, operaciones de servidor y rutas. |
| Interfaz | **Tailwind CSS + shadcn/ui** | Consistencia visual y componentes reutilizables. |
| Base de datos | **PostgreSQL administrado en Supabase** | Relaciones, unicidad, integridad y mediciones históricas. |
| Acceso a datos | **Supabase JS + tipos generados** | Evitar una capa ORM redundante. |
| Identidad | **Supabase Auth** | Sesiones gestionadas en lugar de implementar contraseñas propias. |
| Evidencias | **Supabase Storage, buckets privados** | Archivos PDF con autorización, sin exposición pública. |
| Validación de datos | **Zod** | Contratos y validaciones de entrada. |
| Generación PDF | **`@react-pdf/renderer`** | Reporte de calidad descargable. |
| Pruebas | **Vitest + Playwright** | Lógica crítica y flujos en navegadores. |
| Calidad | **ESLint + Prettier + GitHub Actions** | Criterios compartidos y verificación automática en PR. |
| Despliegue | **Vercel + Supabase** | Infraestructura administrada para el prototipo. |
| Paquetes | **npm con lockfile** | Instalación reproducible y un gestor compartido. |

## Estilo arquitectónico aprobado

- **Monolito modular y un solo repositorio**; un único proyecto Next.js, sin microservicios ni backend separado.
- Organización prevista por funcionalidades: proyectos, actividades, evidencias, métricas, salud y reportes. La estructura física final aún requiere validación.
- La lógica que modifica datos se ejecutará en el servidor; las políticas **Row Level Security (RLS)** complementan la autorización por rol y proyecto.
- Esquema y políticas de PostgreSQL bajo **migraciones SQL versionadas** gestionadas con Supabase CLI; no usar ediciones manuales no versionadas como fuente de verdad.
- La visualización de salud y los reportes deberán reutilizar el mismo resultado del cálculo cuando se apruebe la fórmula. Mientras tanto, mostrar datos reales y «Sin evaluar».

## Qué NO se eligió

- No usar **Prisma**, Auth.js, Firebase, API/backend independiente, microservicios o un proveedor separado de archivos como segunda solución predeterminada.
- No requerir Redis, colas de trabajo, WebSockets, monorepo multiaplicación ni Docker obligatorio para esta primera versión.
- GitHub Issues puede utilizarse para defectos; **no** se ha aprobado una integración automatizada GitHub–QAlly.

## Estado del diseño y aspectos pendientes

El diseño inicial C4, ER, diccionario y controles está documentado en [diseño arquitectural](diseno-arquitectural.md) tras [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md), sin cambiar este stack. Los puntos siguientes se refieren al detalle o implementación aún pendiente.

- Versiones de Next.js y dependencias de interfaz. Las herramientas de datos y sus comandos ya están fijados y comprobados localmente.
- Promoción futura a Cloud de las migraciones, catálogos, funciones y políticas RLS ya implementados y probados localmente conforme a ADR-002.
- Ciclo de sesión de Next.js con Supabase Auth y endpoints de evidencias. Auth, políticas Storage y protocolo local de reserva/confirmación/limpieza ya cuentan con pruebas de integración; falta la aplicación web.
- Cuentas/planes y despliegue remoto. Variables locales y workflow de BD preparados; CI remoto aún no ejecutado.
- Implementación de [contratos v1](contratos-v1.md) aprobados y estructura concreta de `src/`; responsabilidades en C3 y archivos/credenciales en seguridad e integridad.

**No confundir:** stack/diseño aprobados ≠ código ya implementado; catálogos v1 aprobados por usuario ≠ ratificación académica independiente. Registrar decisiones técnicas posteriores en `docs/decisiones/registro.md`.

## Versiones del bootstrap de datos — 2026-10-18

Se usa Node.js 24 (comprobado 24.18.1), npm 12.0.2, Supabase CLI 2.121.0, Supabase JS 2.118.0, TypeScript 7.0.2, Vitest 5.0.5 y @types/node 24.19.2. Dependencias exactas y lockfile versionados; Docker local disponible 29.8.2. PostgreSQL local configurado en versión mayor 17. Las versiones de Next.js/UI todavía no se han elegido ni instalado.

El usuario autorizó este bootstrap después de aprobar el plan. [Guía y estado de implementación](../datos/guia-supabase.md). La compatibilidad con una futura base Cloud se verificará antes de enlazarla.

## Integración de UI y datos — 2026-10-19

Integración autorizada de `origin/feat/ui-base` y `base/supabase-bootstrap` sobre `dev`, conservando monolito modular, migraciones y catálogos aprobados. UI: Next.js 16.4.2, React/React DOM 19.3.0 y Tailwind 4 (resoluciones exactas en lockfile). Node 24 y @types/node 24 se conservan.

TypeScript se unifica en **5.9.3**, versión existente en la UI, porque el analizador de ESLint de esa rama admite `>=4.8.4 <6.1.0`; reemplaza la versión 7.0.2 del bootstrap. `tsconfig.json` conserva las opciones de Next.js/JSX, alias `@/` y los tipos de BD, con target ES2024. No se cambia el esquema ni los contratos del producto.

En el momento de la integración, la UI conservaba datos y sesión de demostración; reunir ambas bases no equivalía a conectar la aplicación a Supabase. CU-01 sustituyó posteriormente esa sesión y conectó sus operaciones; los demás casos se desarrollarán progresivamente. [Flujo y validación](../equipo/integracion-ui-bd.md).

## Implementación local de CU-01 — 2026-10-19

Se incorpora el adaptador oficial `@supabase/ssr` 0.12.7 para sesiones de Auth con Next.js, Zod 4.6.7 para las entradas aprobadas y Playwright 1.64.1 para los flujos de navegador. Mismo monolito y mismos servicios Supabase; no se añade backend separado ni se modifica el esquema. Sesión SSR y proxy Next.js 16 implementados localmente, sin clientes privilegiados en las operaciones de CU-01. [Validación y límites](../modulos/cu01-implementacion.md).
