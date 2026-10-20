# Estructura inicial sugerida para QAlly

**Estado: PROPUESTA TÉCNICA de referencia**, compatible con monolito modular, Next.js y Supabase del stack aprobado. La integración UI/BD y CU-01 ya crearon una estructura física similar; el árbol siguiente conserva la propuesta original y no es un inventario exacto. No obliga a crear carpetas o capas adicionales.

## Realización actual — 2026-10-19

- `src/app/`, `src/components/` y `src/features/` contienen rutas y componentes de los módulos. CU-01 a CU-04 y sesión están conectados al backend real; CU-05/06 conservan componentes para reutilización posterior.
- `src/features/projects/actions.ts`, `validation.ts` y `server/queries.ts` concentran mutaciones, validación y lecturas de proyectos; autorización compartida en `src/lib/session.ts` y `project-context.ts`. No se crearon carpetas `permissions/` o `validations/` vacías.
- `src/lib/supabase/server.ts` y `src/proxy.ts` gestionan el cliente SSR y la sesión; `database.types.ts` contiene los tipos generados. `src/lib/mock/` conserva datos del prototipo, fuera de los flujos reales de CU-01 a CU-04.
- `supabase/migrations/`, `supabase/seed.sql` y `scripts/` implementan BD, catálogos, cuentas/datos ficticios y operación local. `tests/database/`, `tests/unit/` y `tests/e2e/` contienen verificaciones reales.

Consultar [guía de CU-01](../modulos/cu01-implementacion.md) y [guía Supabase](../datos/guia-supabase.md).

## Árbol de referencia original

```text
qally/
├── .github/workflows/        # Checks de PR
├── docs/                     # Requisitos, diseño y decisiones
├── supabase/
│   ├── migrations/           # Esquema y RLS versionados
│   └── seed.sql              # Catálogos/datos de prueba
├── src/
│   ├── app/                  # Rutas, vistas y endpoints de Next.js
│   ├── components/ui/        # Componentes de interfaz compartidos
│   ├── features/
│   │   ├── projects/
│   │   ├── activities/
│   │   ├── evidences/
│   │   ├── metrics/
│   │   ├── health/
│   │   └── reports/
│   └── lib/
│       ├── supabase/         # Clientes/configuración según entorno
│       ├── permissions/      # Validación de rol y acceso por proyecto
│       └── validations/      # Esquemas reutilizables
├── tests/
│   ├── unit/
│   └── e2e/
├── AGENTS.md
├── README.md
├── .env.example
├── package.json
└── package-lock.json
```

## Reglas de colaboración propuestas

- Un responsable revisa migraciones/contratos comunes para evitar conflictos entre ramas.
- Los componentes de `app/` orquestan pantallas y operaciones; la lógica compartida reside en `features/` o `lib/`.
- No acceder desde el navegador a secretos, credenciales privilegiadas ni archivos privados sin autorización.
- Usar PR, revisión de pares y pruebas del cambio; ajustar estas reglas en el acuerdo de contribución cuando el equipo apruebe el workflow.

Codex debe **proponer ajustes si el diseño ER o las dependencias reales lo requieren**, no forzar esta estructura sin revisión.
