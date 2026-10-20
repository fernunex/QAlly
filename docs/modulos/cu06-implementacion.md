# CU-06 — Implementación y validación local

**Fecha: 2026-10-20. Estado: generación, vista y exportación PDF implementadas y validadas localmente; algoritmo y clasificación de salud siguen PENDIENTES.** Rama `feat/cu06-reportes` desde `feat/cu05-salud-proyecto`. Fuente de alcance: [CU-06](../requisitos/casos-uso/CU-06.md), RF-30 a RF-33, RNF-01/02/03/06/07, [contratos v1 §6 y §7](../arquitectura/contratos-v1.md) y [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). Sin migraciones ni cambios de RLS, reglas de negocio o requisitos. Única dependencia nueva: `@react-pdf/renderer` 4.9.0 (APROBADA en el [stack](../arquitectura/stack-aprobado.md)), fijada sin rango como el resto de dependencias principales.

## Uso local

Misma preparación que [CU-01](cu01-implementacion.md#uso-local). `.env.local` debe contener `REPORT_SNAPSHOT_KEY_BASE64` (32 bytes aleatorios en base64): `npm run db:start` y `npm run db:env` la generan si falta y la conservan si ya existe, sin imprimirla; `.env.example` solo documenta el nombre. Como QA participante, abrir un proyecto y la pestaña **Reportes** (`/proyectos/{proyectoId}/reportes`), también con el proyecto cerrado. El Miembro del equipo no ve la pestaña y la ruta le muestra «Este proyecto no está disponible».

## Realización técnica

- `src/features/reports/actions.ts` — `generarReporte(proyectoId)` (acción de servidor, contrato `generarReporte(contexto, {proyectoId})`): sesión verificada; rol distinto de QA → `PROHIBIDO` sin consultar el proyecto; identificador malformado, proyecto ajeno o inexistente → `NO_DISPONIBLE`. **Reutiliza `consultarResumen` de CU-05** (la RPC vuelve a exigir participación; no hay consulta duplicada) y devuelve `{resumen, capturaToken, venceEn}` más `emitidaEn` (ver decisión 1). Cada llamada es una regeneración: nueva lectura, nueva fecha y nuevo token.
- `src/features/reports/server/captura.ts` — captura autocontenida: payload `{version: 1, usuarioId, proyectoId, emitidaEn, venceEn, resumen}`, vigencia de 15 minutos, JSON UTF-8 de hasta 1 MiB (si se supera, `TAMANO_EXCEDIDO`, sin truncar). AES-256-GCM de `node:crypto` con la clave de entorno de 32 bytes, nonce aleatorio de 12 bytes por captura, tag de 16 bytes y el identificador de formato como datos autenticados (AAD). Token `v1.iv.ciphertext.tag` en base64url. `verificarCaptura` comprueba formato, integridad, forma, usuario y proyecto (cualquier falla → el mismo `DATOS_INVALIDOS`); `comprobarVigencia` informa `CAPTURA_EXPIRADA` solo para una captura íntegra y propia. Sin clave válida: fallo técnico genérico. No hay tabla ni memoria compartida: no existe historial de reportes y rotar la clave invalida las capturas abiertas.
- `src/app/api/reportes/pdf/route.ts` — `POST /api/reportes/pdf` con JSON estricto `{capturaToken}`: `Origin` obligatorio y del mismo host (si no, 403); sesión (401) y rol QA (403); cuerpo contado en bytes reales hasta 2 MiB (413); token verificado (422); participación vigente con la sesión del usuario y RLS mediante `consultarProyecto` (404); vigencia (410). Nunca acepta un `resumen` del navegador ni vuelve a consultar la calidad: renderiza el resumen de la captura con su `emitidaEn`. PDF de hasta 3 MiB (si se supera, 413 con mensaje explícito, sin recortar). Respuesta adjunta privada: `Content-Type: application/pdf`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff` y nombre saneado `reporte-calidad-{proyecto}-{AAAAMMDD-HHmm}.pdf`. Se ejecuta en el runtime Node.js predeterminado (con `cacheComponents` Next no admite declarar `runtime`); Next ya trata `@react-pdf/renderer` como paquete externo de servidor, sin cambios en `next.config.ts`.
- `src/features/reports/server/pdf.tsx` — documento `@react-pdf/renderer` A4 con la fuente estándar Helvetica incluida en el motor: no descarga fuentes, imágenes ni enlaces. Esa fuente usa WinAnsi, por lo que «≥»/«≤» se escriben «>=»/«<=» solo en el PDF. Sin guiones automáticos de corte; numeración «Página n de m».
- `src/features/reports/lib/modelo.ts` — `modeloReporte(resumen, emitidaEn)`: único modelo de presentación que consumen la vista y el PDF, para que ambos tengan el mismo contenido: identificación del proyecto (nombre, descripción, periodo, fechas y estado abierto/cerrado), fecha de generación (UTC), métricas con último valor, valor de críticas, objetivo, cumplimiento, estado de medición y fecha («Sin medición (no equivale a 0)» explícito), actividades SQA por estado y por las tres etapas con responsable y estado, y salud general y por etapa tal como la entrega el resumen («Sin evaluar», motivo «Algoritmo pendiente») con la nota común de CU-05. Solo da formato: no calcula salud, porcentajes, pesos ni categorías.
- UI: `generador-reporte.tsx` (botón **Generar reporte**, vista, **Regenerar reporte**, **Exportar a PDF**, FE-01 con «Reintentar» y sin datos parciales, FE-02 con «Reintentar exportación», captura expirada con «Regenerar reporte»), `reporte-documento.tsx` (prototipo conectado al modelo real; ya no importa `src/lib/mock`) y `reporte-acciones.tsx` (barra con la vigencia de la captura). El token vive solo en el estado del componente: no se pone en la URL, `localStorage` ni registros.
- Compartido: `src/lib/http.ts` agrupa estados HTTP del sobre de error, cabeceras privadas, control de `Origin`, lectura de cuerpo con límite y nombre de adjunto, antes duplicados en el route handler de CU-04; `archivos.ts` y el POST de evidencias los reutilizan sin cambiar comportamiento (mismo límite de 3 MiB, mismos códigos). `CAPTURA_EXPIRADA` se añadió a los mensajes públicos ya definidos por los contratos (410). `NOTA_SALUD` pasó de `salud-proyecto.tsx` a `src/features/health/lib.ts` para que vista de salud y reporte compartan el texto.

### Reglas respetadas

- Solo QA participante genera y exporta, comprobado en el servidor en la acción y en el route handler (ocultar la pestaña es solo presentación). Proyectos cerrados: se genera y exporta sin modificar datos.
- Vista y PDF usan la misma captura del resumen de CU-05; regenerar actualiza la vista, su fecha y el token. Un cambio posterior en el proyecto no altera el PDF de la captura vigente.
- Sin algoritmo, pesos, rangos, puntajes ni categorías de salud; sin medición nunca se muestra como 0.

## Decisiones de implementación que requieren visto bueno

1. **`emitidaEn` en el resultado de `generarReporte`.** El contrato enumera `{resumen, capturaToken, venceEn}`; se añade `emitidaEn` (campo aditivo, ya presente en el payload) para que la vista muestre exactamente la misma fecha de generación que el PDF. `resumen.generadoEn` (instante de la lectura en la BD) se conserva sin cambios. Alternativa sin campo nuevo: igualar `emitidaEn` a `generadoEn`.
2. **Códigos del route handler:** token alterado, mal formado, de otro usuario o JSON inválido → `DATOS_INVALIDOS` (422) sin distinguir la causa; QA sin participación vigente → `NO_DISPONIBLE` (404). Los contratos solo exigen el rechazo.
3. **«≥»/«≤» como «>=»/«<=» en el PDF** por la codificación de la fuente estándar, evitando incorporar archivos de fuente.

## Pruebas reproducibles

```sh
npm run unit:test
npm run db:lint
npm run db:test
npm run typecheck
npm run lint
npm run build
npx playwright test tests/e2e/cu06.spec.ts   # o la suite completa: npm run e2e:test
```

Requisitos de E2E iguales a CU-01. Cada escenario crea proyectos aislados por RPC; no borra datos existentes.

## Resultado comprobado

- **67 pruebas unitarias aprobadas** (13 nuevas en `tests/unit/reportes.test.ts`): cifrado/descifrado con formato `v1.iv.ciphertext.tag`, IV de 12 y tag de 16 bytes y contenido no legible; nonce distinto por captura; rechazo de IV, texto cifrado o tag alterados, prefijo o segmentos inválidos y otra clave; vigencia hasta 15 min − 1 ms y `CAPTURA_EXPIRADA` a los 15 min solo para capturas íntegras y propias; otro usuario u otro proyecto; límite exacto de 1 MiB en bytes UTF-8 aceptado y un byte más rechazado; clave ausente o de 16 bytes; modelo con Sin medición, Sin evaluar y tres etapas; nombre de archivo saneado; PDF `%PDF-`/`%%EOF` y PDF de 1000 actividades (30 páginas, ≈ 220 KB) bajo 3 MiB; acción `generarReporte` como QA, Miembro (PROHIBIDO sin consultar), ajeno/malformado (NO_DISPONIBLE), resumen excesivo (TAMANO_EXCEDIDO) y sin sesión.
- **20 pruebas de integración de BD aprobadas** sin cambios en migraciones; SQL lint sin errores.
- **60 escenarios E2E aprobados** en la suite completa (10 de CU-06: 5 por navegador, más los 50 de CU-01 a CU-05 sin regresión, incluidos los de CU-04 tras compartir `src/lib/http.ts`) con Chromium y Firefox de Playwright 1.64.1, Linux x86_64. Suite completa: 4,5 min; no son tiempos RNF.
- Se verifica: QA abre Reportes y el reporte no se genera hasta pulsar **Generar reporte**; identificación, descripción, fecha y estado; M-01 «Sin medición (no equivale a 0)» con objetivo general y de críticas; M-02 con 95.00 %, Cumple y fecha; actividades de las tres etapas con responsable o «Sin responsable»; salud general y por etapa «Sin evaluar» con motivo y sin categorías; **Regenerar** cambia la fecha de generación; descarga de PDF válido con `Cache-Control: private, no-store`, `nosniff`, adjunto y nombre con la fecha emitida; el token no aparece en la URL ni en `localStorage`/`sessionStorage`. En el servidor: token íntegro exportable, alterado (texto cifrado o tag) o mal formado → 422, resumen libre adicional → 422, `Origin` ausente o ajeno → 403, cuerpo > 2 MiB → 413, token de QA A usado por QA B → 422, sin sesión → 401. Miembro sin pestaña, con «Este proyecto no está disponible» y POST directo → 403; QA no participante sin acceso. Proyecto cerrado: aviso de solo lectura, generación y PDF válidos. FE-01 (acción de servidor abortada) con «Reintentar», FE-02 (exportación 500) con «Reintentar exportación» y respuesta 410 con «Regenerar reporte», que actualiza vista y fecha.
- Lint, generación de rutas, TypeScript y build aprobados.

**Límites de esta ejecución:** la expiración real (410) del servidor se prueba con reloj controlado en unitarias; en E2E la respuesta 410 se simula para comprobar la UI, porque esperar 15 minutos no es viable. FE-01/FE-02 se provocan interceptando peticiones en el navegador. El límite de 3 MiB del PDF no se alcanza con datos reales (1000 actividades ≈ 220 KB), por lo que su rama de error se cubre por revisión. «Modificar el resumen visible no modifica el PDF» se garantiza por diseño (el PDF solo se construye desde la captura cifrada y se rechaza un `resumen` libre), sin comparar textos del PDF en E2E. Node local 26.11.1 (package.json declara 24). Supabase local sobre Podman con alias temporal `docker → podman` en el `PATH`, como en [CU-03](cu03-implementacion.md); sin ese alias, la prueba de BD de cierre concurrente falla por `spawn docker ENOENT`. No se probó con Chrome estable instalado, en GitHub Actions ni en Vercel. `npm audit` mantiene los 9 avisos altos previos (cadena `braces` de herramientas de desarrollo); `@react-pdf/renderer` no añade avisos. No se hizo push ni despliegue.

## Pendiente

- **Algoritmo de salud** (RF-26 y clasificación final de RF-27). Al aprobarse, el reporte lo mostrará automáticamente desde `ResumenProyecto`; el modelo y el PDF deberán ampliarse para presentar la clasificación aprobada.
- Configurar `REPORT_SNAPSHOT_KEY_BASE64` distinta por entorno en Cloud/Vercel cuando exista despliegue.
- Medir RNF-06 (tiempos de generación/exportación) en entorno desplegado con el dataset de aceptación.

## Trazabilidad

Se conservan RF, RNF y reglas aprobadas.

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| RF-33; RNF-01/02/03; regla «solo QA» | `generarReporte` y `POST /api/reportes/pdf` exigen sesión, rol QA y participación en el servidor; RPC con RLS. | Unitarias de la acción (Miembro → PROHIBIDO sin consulta, ajeno/malformado → NO_DISPONIBLE); E2E Miembro sin pestaña ni pantalla y POST directo 403, QA ajeno sin acceso, sin sesión 401. |
| Pasos 1–6; RF-30/31; RNF-07 | Pestaña Reportes con Generar reporte y vista con identificación, fecha, métricas, actividades por etapa y salud. | E2E en Chromium y Firefox; unitarias del modelo. |
| FA-01; RF-31/32 | «Sin medición (no equivale a 0)» y salud «Sin evaluar» con motivo; sin categorías. | E2E y unitarias del modelo. |
| SF-01; RF-32; RNF-06 | PDF con `@react-pdf/renderer` desde la captura verificada, misma fecha emitida, adjunto privado ≤ 3 MiB. | E2E descarga con `%PDF-`/`%%EOF`, cabeceras privadas y nombre; unitaria con 1000 actividades. RNF-06 pendiente en despliegue. |
| Regla de captura (ADR-002) | AES-256-GCM, 15 minutos, 1 MiB/2 MiB/3 MiB, `Origin` obligatorio, sin resumen libre. | Unitarias de cifrado, tamper, otra clave, expiración, usuario/proyecto distinto y límite exacto; E2E token alterado/ajeno, resumen libre, origen ausente/ajeno y cuerpo > 2 MiB. |
| Regenerar; FE-01; FE-02 | Regenerar actualiza vista, fecha y token; errores con reintento; 410 pide regenerar. | E2E con fallos simulados de la acción y de la exportación y respuesta 410. |
| Regla de proyectos cerrados | Generación y exportación permitidas con aviso de solo lectura. | E2E proyecto cerrado. |
