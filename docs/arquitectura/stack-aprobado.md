# Stack y estilo arquitectónico aprobados — 2026-10-18

**Estado: APROBADO por el PM tras revisar la propuesta técnica.** Esta es la fuente canónica del stack. No implica que exista aún una implementación funcional ni que estén aprobadas versiones o configuraciones específicas.

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

- Versiones exactas de Node.js, Next.js y dependencias; comando de arranque hasta verificar el repositorio.
- Migraciones/semillas ejecutables, funciones transaccionales y políticas RLS SQL. ER, límites, tipos, precisión e interfaces ya están aprobados por ADR-002; falta realizarlos y probarlos.
- Configuración final del ciclo de sesión de Next.js con Supabase Auth; implementación de políticas Storage y protocolo de archivos aprobado (PDF 3 MiB, enlaces HTTP/HTTPS, reserva/limpieza), pendiente de pruebas.
- Variables de entorno, cuentas/planes y configuración de despliegue; definición precisa de checks de CI y estrategia de pruebas.
- Implementación de [contratos v1](contratos-v1.md) aprobados y estructura concreta de `src/`; responsabilidades en C3 y archivos/credenciales en seguridad e integridad.

**No confundir:** stack/diseño aprobados ≠ código ya implementado; catálogos v1 aprobados por usuario ≠ ratificación académica independiente. Registrar decisiones técnicas posteriores en `docs/decisiones/registro.md`.
