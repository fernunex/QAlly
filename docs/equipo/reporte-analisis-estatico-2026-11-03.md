# Reporte de análisis estático — 2026-11-03

**Estado: PRELIMINAR, 2026-11-03.** Es la evidencia de la técnica 4, «Inspección automatizada», del [plan de pruebas DEC-25–31](plan-pruebas-dec25-28.md#4-inspección-automatizada) (caso IA-09). Su forma sigue la evidencia que pide la actividad A-05 del [catálogo](../producto/catalogo-actividades.md): herramienta, versión/commit, alcance, resultados y tratamiento. Es SQA del equipo sobre QAlly, no una actividad SQA de un proyecto dentro del producto.

## Datos de la ejecución

| Campo | Valor |
|---|---|
| Rama / commit | `feat/salud-dec27` @ `9b19445`; el único cambio sin commit es `docs/decisiones/registro.md` (sin código) |
| Fecha | 2026-11-03 |
| Ejecutó | Emi (emidsm), autor del cambio, antes de la integración |
| Entorno | Linux, Node v26.11.1 (**fuera** de `engines` `>=24 <25`; ver H-05), Supabase local con las 7 migraciones aplicadas |

## Herramientas y alcance

| # | Herramienta | Versión | Comando | Alcance | Configuración |
|---|---|---|---|---|---|
| E-1 | ESLint | 9.39.5 | `npm run lint` (`eslint .`) | 166 archivos: `src/` (134), `tests/` (21), `scripts/` (6) y configuraciones | `eslint.config.mjs`: `eslint-config-next` 16.4.2 (`core-web-vitals` + `typescript`); ignora `.next/`, `out/`, `build/` |
| E-2 | TypeScript (`tsc`) | 5.9.3 | `npm run typecheck` (`next typegen && tsc --noEmit`) | Todo `**/*.ts`/`.tsx` del repositorio (154 archivos versionados más los tipos de rutas generados) | `tsconfig.json` con `strict: true` |
| E-3 | `supabase db lint` (plpgsql_check) | CLI 2.121.0 | `npm run db:lint` | Esquemas `public` y `private` de la BD local | Nivel `error`, falla en `error` (umbral del proyecto) |
| E-4 | `supabase db lint` | CLI 2.121.0 | `npx supabase db lint --local --schema public,private --level warning` | Igual que E-3 | Nivel `warning`, sólo informativo (no es umbral del proyecto) |

Además se buscaron supresiones en `src/` y `tests/` (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`): **ninguna**.

## Resultados

| # | Herramienta | Resultado | Errores | Advertencias |
|---|---|---|---|---|
| E-1 | ESLint | **OK** (exit 0) | 0 | 0 |
| E-2 | `tsc --noEmit` | **OK** (exit 0) | 0 | — |
| E-3 | `db lint` nivel error | **OK** (exit 0; `results: []`) | 0 | — |
| E-4 | `db lint` nivel warning | Informativo | 0 | 15 avisos en 9 funciones |

Con el umbral del proyecto (E-1 a E-3), **IA-09 queda en OK**. Los avisos de E-4 se revisaron uno por uno:

| H | Función(es) | Aviso | Avisos | Análisis | Tratamiento |
|---|---|---|---|---|---|
| H-01 | `private.calcular` (IMMUTABLE); `private.exigir_sesion`, `private.exigir_acceso`, `private.aporte_metrica`, `public.buscar_miembros_elegibles`, `public.consultar_salud` (STABLE) | «routine is marked as STABLE/IMMUTABLE, but expression is VOLATILE» | 12 | Todos los `PERFORM` señalados llaman a `private.fallar` (o a `exigir_*`, que a su vez la llaman). `fallar` sólo hace `raise exception`; no escribe datos, así que no rompe la volatilidad declarada. El linter no lo puede inferir porque `fallar` es VOLATILE por omisión. | Falso positivo. **Aceptado**, sin cambio. Opcional: declarar `fallar` como `immutable`, lo cual requiere aprobar una migración. |
| H-02 | `public.agregar_metrica` | «control reached end of function without RETURN» (extra) | 1 | El manejador `exception when unique_violation` termina con `perform private.fallar('CONFLICTO')`, que siempre lanza; nunca se llega al final sin `return`. | Falso positivo. **Aceptado**. |
| H-03 | `public.marcar_limpieza` (`result jsonb:='[]'`), `private.salud_json` (`adv text[]:='{}'`) | «target type is different type than source type» | 2 | Inicialización con un literal sin tipo; PostgreSQL lo convierte correctamente (`'[]'`→`jsonb`, `'{}'`→`text[]`). `db:test` cubre ambas funciones. | Estilo. **Aceptado**. Opcional: `'[]'::jsonb` y `'{}'::text[]` en una migración futura. |
| H-04 | — | Revisión manual de supresiones | 0 | No hay reglas desactivadas ni errores de tipo silenciados. | Sin acción. |
| H-05 | Entorno | Node v26.11.1 frente a `engines` `>=24 <25` | — | No afectó a los resultados, pero la ejecución no corresponde a la versión declarada. | **Pendiente:** repetir con Node 24 antes de cerrar la beta. |

## Defectos registrados

Ninguno nuevo. Los avisos de E-4 no son defectos según el análisis anterior, así que no se agregan al [registro de defectos](plan-pruebas-dec25-28.md#registro-de-defectos). Los defectos 2 y 3 de ese registro ya se habían detectado con inspección automatizada (`db:test`, `unit:test`), no con análisis estático.

## Lo que no cubre este reporte

- Pruebas dinámicas (`unit:test`, `db:test`, E2E): están en IA-01…IA-08 y en las demás técnicas del plan.
- Análisis de seguridad o de dependencias (`npm audit`) y Firefox: no se ejecutaron.
- La revisión humana del PR (A-06) y el checklist de revisión de código.

## Reproducir

```bash
npm run db:start
npm run lint && npm run typecheck && npm run db:lint
npx supabase db lint --local --schema public,private --level warning   # informativo
```
