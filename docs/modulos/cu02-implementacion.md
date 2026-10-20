# CU-02 — Implementación y validación local

**Fecha: 2026-10-19. Estado: implementado y validado localmente.** El usuario solicitó implementar CU-02 en su propia rama desde `dev` (`feat/cu-02-metricas`), probarlo y abrir PR hacia `dev`. Fuente de alcance: [CU-02](../requisitos/casos-uso/CU-02.md), RF-08 a RF-14/RF-33, RNF asociados, [catálogo de métricas v1](../producto/catalogo-metricas.md) y [contratos v1 §4](../arquitectura/contratos-v1.md). Sin migraciones, sin cambios de RLS, contratos ni reglas de negocio.

**Actualización de integración:** este registro conserva los resultados individuales de la rama. CU-02, CU-03 y CU-04 se reúnen posteriormente con CU-01; consultar [resoluciones, pruebas conjuntas y pendientes actuales](../equipo/integracion-cu02-cu03-cu04.md). Las referencias a otro CU sin interfaz describen el estado previo a esa integración.

## Uso local

Misma preparación que [CU-01](cu01-implementacion.md#uso-local). Abrir un proyecto y la pestaña **Métricas**. QA participante en proyecto abierto puede agregar métricas del catálogo no configuradas, registrar mediciones, corregirlas y editar objetivos. Miembro del equipo y QA en proyecto cerrado consultan métricas, historial y correcciones sin controles de gestión.

## Realización técnica

- `src/features/metrics/server/queries.ts`: lecturas con la sesión del usuario y RLS. `listarMetricas` usa la RPC `consultar_metrica` por cada métrica del proyecto (como máximo una por tipo del catálogo), de modo que valor actual, condición y cumplimiento salen de `private.metrica_json` y no se recalculan en la aplicación. `listarMediciones` pagina por `medida_en DESC, orden_registro DESC` con cursor validado y devuelve solo la última revisión de cada medición; `listarCorrecciones` (listarRevisionesMedicion del contrato) pagina revisiones por número descendente y añade el valor anterior y la captura original.
- `src/features/metrics/actions.ts`: Server Actions con sesión verificada, rol QA, participación y proyecto abierto antes de llamar a `agregar_metrica`, `configurar_objetivo`, `registrar_medicion` y `corregir_medicion`; las RPC vuelven a autorizar. Métrica o medición inexistente o ajena se tratan igual (NO_DISPONIBLE). Sin credencial de servicio.
- `src/features/metrics/validation.ts`: esquemas Zod estrictos. El servidor no acepta `valor` ni `cumplimiento`; construye `datos_fuente` solo con las claves del tipo y `fuente_referencia` recortada, con las mismas reglas de conteos y relaciones de M-01 que la vista previa. Objetivos por tipo (M-01 exige crítico; M-02..M-04 no lo admiten; M-04 entero) se transportan como cadena exacta, sin pasar por `Number`.
- `src/features/metrics/dto.ts` y `types.ts`: adaptación de la respuesta de la BD. «Sin medición» se distingue de cero y de No evaluable. Los tipos de mocks de `src/lib/domain.ts` no se modifican; los usa todavía el prototipo de salud.
- Componentes existentes (`metricas-vista`, `metrica-detalle-sheet`, `medicion-dialog`, `agregar-metrica-dialog`, `objetivo-campos`) conectados a las acciones; se retiran los guardados simulados.

### Concurrencia, idempotencia y vigencia

- **Registrar:** `medicionId` estable generado en el primer envío del formulario. Si la respuesta se pierde, los campos quedan bloqueados y el botón cambia a «Reintentar registro» con la misma identidad y datos; la RPC devuelve la medición existente (`reutilizada`) sin duplicar. Misma identidad con otros datos → CONFLICTO.
- **Corregir:** envía la revisión esperada; una segunda corrección sobre la misma revisión recibe CONFLICTO y no crea otra. La fecha de medición no se edita.
- **Objetivo:** reenvía `configuradaEn` exacto devuelto por la BD (microsegundos y zona) como token; una pestaña desactualizada recibe CONFLICTO y no sobrescribe.
- **Agregar:** el tipo ya configurado no se ofrece; una solicitud duplicada se rechaza por la restricción única y se informa (FE-02).
- **Fecha de medición:** se captura como día y se guarda a las 00:00 UTC y se muestra como día de calendario con `formatDia`, sin conversión de zona (DEC-24). La vigencia la determina la BD; la «Actual» del historial es la primera en su orden.

Tras cada guardado se muestra la respuesta del servidor, se revalida la ruta y se recarga el historial abierto. No se muestra éxito antes de la confirmación.

## Pruebas reproducibles

```sh
npm run unit:test
npm run db:test
npm run db:lint
npm run typecheck
npm run lint
npm run e2e:test   # o: npx playwright test tests/e2e/cu02.spec.ts
```

Requisitos de E2E iguales a CU-01. Cada escenario crea proyectos aislados por RPC; no borra datos existentes.

## Resultado comprobado

- **29 pruebas unitarias aprobadas** (8 nuevas de CU-02): objetivos por tipo, datos fuente exactos y relaciones de M-01, esquemas estrictos sin valor/cumplimiento, token de configuración exacto, cursor del historial, lectura Sin medición/No evaluable.
- **20 pruebas de integración de BD aprobadas** sin modificar migraciones; SQL lint sin errores.
- **26 escenarios E2E aprobados** (8 de CU-02: 4 por navegador, más los de CU-01 sin regresión) con Chromium de Playwright **156.0.8078.4** y Firefox **157.0**, Linux x86_64, Supabase local sobre podman. CU-02 completo: 52,9 s; no son tiempos por operación RNF.
- Se verifica: alta desde catálogo con validación y Sin medición; duplicado rechazado; Miembro consulta sin controles y sus llamadas directas reciben PROHIBIDO; QA ajeno NO_DISPONIBLE; sin sesión SIN_SESION; registro con vista previa y cumplimiento; medición con fecha anterior que no reemplaza el valor actual; objetivo que reevalúa el cumplimiento y conflicto entre pestañas sin sobrescritura; corrección de una medición antigua sin cambio del valor actual; corrección de la vigente con recálculo y traza original/anterior/nuevo/autor; corrección repetida rechazada; reintento idempotente y conflicto con datos distintos; denominador cero No evaluable; proyecto cerrado en solo lectura con PROYECTO_CERRADO; historial paginado en orden de vigencia.
- Lint, generación de rutas, TypeScript y build aprobados.

**Límites de esta ejecución:** Node local 26.11.1 (package.json declara 24; CI usa la versión fijada). `tests/database` invoca `docker exec`; en esta máquina se ejecutó con `docker` apuntando a podman, sin cambios en el repositorio. No se probó con Chrome estable instalado ni en GitHub Actions. RNF-04/05 siguen pendientes de medición en entorno desplegado. No se hizo despliegue.

## Trazabilidad

Se conservan RF, RNF y reglas aprobadas.

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| RF-33; RNF-01/02/03 | Acciones con sesión verificada, rol QA, participación y proyecto abierto; RPC y RLS reautorizan. | E2E llamadas directas como Miembro/QA ajeno/sin sesión y proyecto cerrado; integración BD existente. |
| Flujo principal, SF-01, FA-01; RF-08/12/14 | Lista con valor actual, objetivo y cumplimiento de la BD; detalle con historial paginado y Sin medición. | E2E consulta como QA/Miembro, vacío, paginación y orden de vigencia; unitarias de lectura. |
| SF-02; RF-11/14; RNF-08/09 | registrar_medicion con identidad estable, validación de datos fuente y vista previa. | E2E registro, fecha anterior, denominador cero, reintento idempotente y conflicto; unitarias de datos fuente. |
| SF-03; RF-10/14; RNF-08/09 | configurar_objetivo con token exacto; reevaluación del cumplimiento. | E2E objetivo y dos pestañas; unitarias de objetivos y token. |
| SF-04; RF-13; RNF-08/09/10 | corregir_medicion con revisión esperada; correcciones con original, anterior, nuevo, autor y fecha. | E2E corrección antigua/vigente, traza y corrección repetida; inmutabilidad en BD. |
| SF-05, FE-02; RF-09/10 | agregar_metrica desde catálogo vigente; tipos configurados excluidos y duplicado rechazado. | E2E alta, validación y duplicado. |
| RNF-07 (parte CU-02) | UI existente conectada a datos reales. | Escenarios CU-02 en Chromium y Firefox de Playwright. |
