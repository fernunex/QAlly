# Estructura inicial sugerida para QAlly

**Estado: PROPUESTA TÉCNICA**, no estructura física final aprobada ni creada. Compatible con monolito modular, Next.js y Supabase del stack aprobado.

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
