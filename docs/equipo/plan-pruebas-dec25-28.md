# Plan de pruebas DEC-25–31 por técnica de revisión

**Estado: PRELIMINAR, 2026-11-02.** Cubre los cambios de [ADR-003](../decisiones/ADR-003-salud-y-reporte.md) (salud calculada, reporte ampliado, diez actividades preseleccionadas, fuente opcional, objetivo porcentual positivo) y la regresión de CU-01 a CU-06. Sigue la forma de trabajo TSP del equipo: cada prueba tiene un **responsable**, se automatiza con Playwright (o Vitest cuando el cálculo vive en la BD) y cada defecto se registra con la **técnica que lo detectó**. Es SQA del equipo para desarrollar QAlly ([SQA en el desarrollo](sqa-en-el-desarrollo.md)), no el catálogo del producto.

## Equipo y casos de uso asignados

Asignación tomada del `git log` de cada CU.

| Integrante | Usuario git | CU que implementó |
|---|---|---|
| Fer | fernunex | CU-01 Gestionar proyectos (más BD, integración y requisitos DEC-25–28) |
| Emi | emidsm | CU-02 Métricas, CU-03 Actividades SQA (y este refactor DEC-25–31) |
| Daniela Hernández | Daniela Hernandez | CU-04 Entrega de evidencias |
| Josuu | Root_Joss | CU-05 Estado de salud |
| David | JDSC21 | CU-06 Reporte de calidad |

## Técnicas y quién hace qué

| Técnica | Quién | Qué revisa | Dónde vive | Comando |
|---|---|---|---|---|
| **1. Revisión personal** | Responsable de cada CU | Su propio CU contra su caso de uso y el [checklist de revisión de código](#checklist) antes de pedir integración | `tests/e2e/cuNN.spec.ts` (una spec por CU) | `npm run e2e:personal` o `npx playwright test tests/e2e/cu05.spec.ts` |
| **2. Caminata** (walkthrough) | La conduce el autor del cambio (Emi); asiste todo el equipo | Recorrido CU-01 → CU-06 de punta a punta, en pantalla, paso por paso | `tests/e2e/caminata.spec.ts`, etiqueta `@caminata` | `npm run e2e:caminata -- --headed --project=chrome` |
| **3. Revisión entre pares** | Un integrante distinto del responsable (rotación abajo) | Bordes, permisos y casos que el autor pudo omitir; revisa también el PR (A-06) | `tests/e2e/pares.spec.ts`, etiqueta `@pares` | `npm run e2e:pares` |
| **4. Inspección automatizada** *(propuesta)* | El autor, antes de abrir el PR | Análisis estático, tipos, SQL y lógica de cálculo, de forma automática | ESLint, `tsc`, `db:lint`, `tests/unit`, `tests/database` | `npm run lint && npm run typecheck && npm run db:lint && npm run unit:test && npm run db:test` |

Sobre la cuarta técnica: TSP distingue la revisión (humana) de las pruebas; las dos primeras fallas que encontró este trabajo no las vio ninguna revisión humana, sino `db:test` y `unit:test` (ver el [registro de defectos](#registro-de-defectos)). Es la más barata y corresponde a la actividad A-05 del catálogo. Los bordes de la fórmula (50/70/90, 89.999 %, tercios) se prueban contra la BD porque ahí vive el cálculo.

### Rotación de revisión entre pares

Nadie revisa su propio CU; Fer revisa CU-05 porque redactó la fórmula de DEC-27, y Josuu revisa CU-06 porque su resultado alimenta el reporte.

| CU | Responsable (revisión personal) | Par revisor |
|---|---|---|
| CU-01 | Fer | Daniela |
| CU-02 | Emi | Josuu |
| CU-03 | Emi | David |
| CU-04 | Daniela | Fer |
| CU-05 | Josuu (código nuevo: Emi) | Fer |
| CU-06 | David | Josuu |

## Matriz de casos

Estado: **Diseñado** (escrito, sin ejecutar), **OK** / **Falla** (con la fecha de la última ejecución en Chrome). Firefox es requisito (RNF de navegadores) y queda pendiente de ejecutar por el responsable.

### 1. Revisión personal: specs por CU

| ID | CU / regla | Caso | Spec | Responsable | Estado |
|---|---|---|---|---|---|
| RP-01 | CU-01, DEC-25 | Alta con las diez actividades preseleccionadas; desmarcar una crea 9; meta 0 % rechazada por el servidor | `cu01.spec.ts` | Fer | Diseñado |
| RP-02 | CU-02, DEC-26 | Gestión de métricas y mediciones (sin cambios de flujo; fuente ahora opcional) | `cu02.spec.ts` | Emi | Diseñado |
| RP-03 | CU-03 | Tablero, asignación e instancias repetidas | `cu03.spec.ts` | Emi | Diseñado |
| RP-04 | CU-04 | Entrega con PDF/enlace, devolución e intentos | `cu04.spec.ts` | Daniela | Diseñado |
| RP-05 | CU-05, DEC-27 | Salud general 28.57 % Malo y por etapa (50 % / 0 % / 25 %), aportes, Sin medición, advertencias, Sin evaluar en proyecto vacío, proyecto cerrado | `cu05.spec.ts` | Josuu | ver ejecución |
| RP-06 | CU-06, DEC-28 | Reporte con la misma salud que CU-05, advertencias, aportes, PDF; captura alterada/expirada; Miembro sin acceso | `cu06.spec.ts` | David | ver ejecución |

### 2. Caminata

| ID | CU | Caso | Responsable | Estado |
|---|---|---|---|---|
| CW-01 | CU-01…06 | Alta por UI (10 preseleccionadas, se desmarcan 6), entregas, medición sin fuente por UI; dashboard, encabezado, listado, vista del Miembro, reporte y PDF muestran 46.67 % Malo / 100 % / Sin evaluar / 36 % | Emi | ver ejecución |
| CW-02 | CU-03…06 | Una aprobación nueva no altera la captura ya generada; al regenerar, reporte y dashboard pasan de 25 % a 40 % | Emi | ver ejecución |

### 3. Revisión entre pares

| ID | CU | Caso | Responsable | Estado |
|---|---|---|---|---|
| PR-01 | CU-01 | Desmarcar las diez actividades y las cuatro métricas: proyecto «Sin evaluar», no 0 % | Daniela | ver ejecución |
| PR-02 | CU-02 | Objetivo 0 % rechazado en la UI; M-04 con 0 aceptado; medición sin fuente se guarda sin referencia | Josuu | ver ejecución |
| PR-03 | CU-03 | Tres instancias del mismo tipo pesan 1 cada una; En revisión no cuenta (33.33 %) | David | ver ejecución |
| PR-04 | CU-04 | Tras devolución, el reporte cita solo la evidencia del último intento enviado | Fer | ver ejecución |
| PR-05 | CU-05 | 95 % Excelente con defectos graves advierte sin tope; 89.999 % se muestra 90.00 % y es Bueno | Fer | ver ejecución |
| PR-06 | CU-06 | Miembro no genera reporte; proyecto cerrado conserva 75 % Bueno en dashboard y reporte | Josuu | ver ejecución |

### 4. Inspección automatizada

| ID | Regla | Prueba | Responsable | Estado 2026-11-02 |
|---|---|---|---|---|
| IA-01 | DEC-27 | Ejemplo de aceptación 68.57 % Regular; solo Aprobada aporta; general ≠ promedio de etapas | `tests/database/salud.test.mjs` | Emi | OK |
| IA-02 | DEC-27 | Aportes: tasas bajo/sobre objetivo con tope 1; M-04 objetivo 0 y positivo; M-01 sin criterio crítico | `salud.test.mjs` | Emi | OK |
| IA-03 | DEC-27 | Sin evaluar, 0 % con elementos, Sin medición/No evaluable en denominador | `salud.test.mjs` | Emi | OK |
| IA-04 | DEC-27 | Clasificación en 0, 49.999, 50, 69.999, 70, 89.999, 90, 100 y suma periódica exacta | `salud.test.mjs` | Emi | OK |
| IA-05 | DEC-26/28/29 | Fuente opcional al registrar/corregir; meta 0 % rechazada; evidencias del último intento; `consultar_salud` solo autorizados | `salud.test.mjs` | Emi | OK |
| IA-06 | DEC-30 | DTO rechaza salud incoherente (Evaluada sin porcentaje, N_A/A/N_M distintos a lo mostrado) | `tests/unit/salud.test.ts` | Emi | OK |
| IA-07 | DEC-28 | Modelo del reporte: misma salud, advertencias por ámbito, enlaces a evidencia sin incrustar | `tests/unit/reportes.test.ts` | Emi | OK |
| IA-08 | Regresión | Resto de unitarias (71) y BD (44) | `npm run unit:test`, `npm run db:test` | Cada autor | OK |
| IA-09 | Estático | ESLint, `tsc`, `supabase db lint` | [Reporte 2026-11-03](reporte-analisis-estatico-2026-11-03.md) | Cada autor | OK |

## Ejecución

```bash
npm run db:start            # Supabase local (con podman: atajo docker en PATH)
npm run db:reset -- --confirm-local-reset && npm run db:seed
npm run e2e:personal        # 1. revisión personal (todas las cuNN)
npm run e2e:caminata -- --headed --project=chrome   # 2. caminata en pantalla
npm run e2e:pares           # 3. revisión entre pares
npx playwright test --grep @cu-05                    # solo un CU en caminata y pares
```

Cada prueba nueva declara su responsable con `annotation` de Playwright; aparece en el reporte HTML (`npx playwright show-report`). La configuración ejecuta Chrome y Firefox; el webServer compila la app antes de empezar. Las E2E dejan proyectos de prueba en la BD local: reiniciar y sembrar antes de una demo.

## Registro de defectos

Formato TSP (LOGD). Tipos: 10 Documentación, 20 Sintaxis, 30 Construcción, 40 Asignación, 50 Interfaz, 60 Comprobación, 70 Datos, 80 Función, 90 Sistema, 100 Entorno. Registrar aquí o en GitHub Issues con la misma columna «Detectado por».

| # | Fecha | CU | Tipo | Inyectado en | Detectado por | Corrección (min) | Descripción | Commit |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-02 | CU-05 | 50 Interfaz | Codificación (SQL) | Revisión personal | 2 | Asignación de un registro con parámetros OUT a variable `record`; se cambió por `select … into` antes de aplicar la migración | `feat/salud-dec27` |
| 2 | 2026-11-02 | CU-05 | 20 Sintaxis | Codificación (SQL) | Inspección automatizada (`db:test`) | 3 | `text[] \|\| 'LITERAL'` se interpretaba como arreglo y fallaba con «malformed array literal» cuando había advertencias; se usó `array_append` | `feat/salud-dec27` |
| 3 | 2026-11-02 | CU-05 | 60 Comprobación | Codificación (DTO) | Inspección automatizada (`unit:test`) | 2 | El DTO aceptaba salud «Evaluada» con porcentaje nulo porque `Number(null)` es 0 | `feat/salud-dec27` |

## Criterios de salida para la beta

- Las cuatro técnicas en verde en Chrome; Firefox ejecutado y registrado por cada responsable.
- Ningún defecto abierto de tipo 80 Función o 60 Comprobación en CU-05/06.
- Matriz actualizada con fecha y resultado, y [trazabilidad](../requisitos/trazabilidad.md) CU–RF–prueba revisada por Fer.
- Los resultados alimentan las métricas internas del equipo (tasa de pruebas aprobadas, PR revisados) que se pueden capturar en el propio QAlly como M-01 y M-02.

## Checklist

La revisión personal usa el checklist `checklist-revision-codigo-qally.xlsx` del equipo (hoy fuera del repositorio; conviene versionarlo en `docs/equipo/`). Para DEC-25–31, agregar: ¿la salud solo se presenta y nunca se recalcula en la interfaz?, ¿«Sin medición» se distingue de 0?, ¿vista y PDF usan el mismo `modeloReporte`?, ¿la meta 0 % se valida en UI, Zod y BD?
