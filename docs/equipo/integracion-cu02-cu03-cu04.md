# Integración de CU-02, CU-03 y CU-04

**Fecha: 2026-10-19. Estado: integración local validada.** Integración local autorizada por el usuario, reanudada después de cancelar la primera ejecución. Mantiene monolito, contratos aprobados, esquema, RLS y dependencias existentes. Salud sigue Sin evaluar; CU-05 y CU-06 no están conectados.

## Ramas e historial

| Origen | Commit incorporado | Alcance |
|---|---|---|
| `origin/feat/cu-02-metricas` | `a22d28e` | Métricas, objetivos, mediciones, correcciones e historial. |
| `origin/feat/cu-03-actividades` | `eec3e1a` | Tablero, alta/asignación de actividad SQA, aprobación y devolución QA. |
| `origin/feat/cu04-entrega-evidencias` | `4badc00` | Mis actividades, inicio, resultados, PDF/enlaces y envío/corrección. |

La primera rama `chore/integrar-cu02-cu03-cu04` conservó los merges al cancelar; no se incorporó a `dev`. Antes de reanudar, el fetch mostró que `origin/dev` había incorporado CU-04 mediante `33ed434` y después lo había revertido con `6c10516`, integrado por `4514e5a`. Su árbol final coincidía con el `dev` previo (`47ddd3a`).

Se actualizó `dev` por fast-forward a `4514e5a`. La nueva rama `chore/integrar-cu02-cu03-cu04-v2` reaplica la reversión con `bb27209` y recupera la primera integración mediante merge. Esto evita que Git considere CU-04 ya incorporado pero mantenga sus archivos eliminados por la reversión. Conserva el historial remoto y los commits de los compañeros; no hace reset ni reescribe ramas compartidas.

La integración final se incorporó al `dev` local con `8fb64b4`; `f82ffd0` retira únicamente una línea vacía al final de un DTO. Las tres ramas están incluidas en el historial de `dev`. `main` no se modificó y esta ejecución no realizó push.

## Resolución de puntos compartidos

- **Actividades:** se conserva el tablero paginado y los filtros de CU-03, con el aviso al Miembro para entregar desde Mis actividades. Se retiran mensajes que anuncian como pendientes la entrega o revisión ya conectadas.
- **PDF:** una única ruta `GET /api/evidencias/{evidenciaId}/archivo`, apoyada en el adaptador de CU-04. Descarga con sesión del usuario y RLS, incluido proyecto cerrado; nombre saneado, adjunto, cabeceras `private, no-store` y `nosniff`. El cliente nunca envía una ruta de Storage como autoridad.
- **Sesión:** el proxy renueva también las rutas `/api/*`; cada acción/handler verifica identidad y autorización. Solo la transferencia validada usa el cliente administrativo del servidor; las consultas y descargas conservan la sesión ordinaria.
- **Utilidades/UI:** se conserva `resumenDevuelto` para el tablero y se retira `conBorrador`, reemplazado por persistencia real. `EvidenciaItem` descarga PDF reales. Los grupos de Mis actividades usan `useId` e identificadores sin espacios para que `aria-labelledby` resuelva correctamente.
- **Documentación:** se unen índice y trazabilidad de los tres CU. Las guías individuales conservan resultados históricos y enlazan este registro como estado conjunto.
- **CI:** `application.yml` usa el nombre `casos-uso-local` para el job que ya ejecuta toda la carpeta E2E. Se conserva Node 24 y Supabase local; no añade secretos Cloud.

## Verificación reproducible

Requiere Node 24, Docker, Supabase local y `.env.local` preparado según la [guía de datos](../datos/guia-supabase.md). Los fixtures añaden datos ficticios; no se hizo reset ni se borró la base existente.

```sh
npm ci
npm run db:start
npm run unit:test
npm run db:lint
npm run db:test
npm run db:types
npm run typecheck
npm run lint
npx playwright install chromium firefox
npm run e2e:test
```

La suite E2E compila y sirve la aplicación de producción en el puerto 3100; debe estar libre. Para usar Chrome estable instalado, definir `QALLY_CHROME_PATH` con la ruta de su ejecutable. No compartir archivos de entorno, cookies ni diagnósticos privados.

## Resultados de la integración

Entorno: Linux x86_64, Node 24.18.1, Docker y Supabase local. Navegadores verificados: Chrome for Testing Stable 155.0.8059.84 y Firefox de Playwright 157.0.

- Instalación reproducible con `npm ci` completada; sin cambios de package.json/lockfile.
- **50 pruebas unitarias aprobadas**: 44 de las ramas integradas y seis pruebas adicionales de fallos/seguridad de archivos.
- **20 pruebas de integración de BD aprobadas**; SQL lint sin errores y regeneración de tipos sin diferencias.
- Lint, TypeScript y build de producción aprobados; la suite E2E prueba esa compilación.
- **44 escenarios E2E aprobados**, 22 por navegador, incluidos CU-01 a CU-04 y las dos pruebas conjuntas nuevas. Suite completa: 4,8 minutos; esta duración no es una medición por operación RNF.
- Enlaces locales y bloques Markdown verificados; sin credenciales privilegiadas locales en los archivos modificados ni en los bundles estáticos.

Las pruebas añadidas cubren el recorrido UI entre sesiones QA/Miembro: alta/asignación, inicio/entrega, devolución, corrección en otro intento, aprobación, cierre y conservación de consulta/descarga. Comprueban que el intento original no se sobrescribe. Una prueba intercepta la respuesta HTTP después de guardar el PDF, simula su pérdida y verifica que recargar recupera una sola evidencia.

Las pruebas de fallos del adaptador usan dobles de Auth/Storage/RPC: rechazo conocido tras transferencia, confirmación ambigua, fallo ambiguo de Storage, fallo al borrar durante compensación, rechazo de un rol no permitido y corte de un cuerpo que supera 3 MiB. Estas pruebas no simulan una caída física de Supabase; complementan las pruebas reales de BD sobre compensación y archivos compartidos.

## Límites y pendientes

- **Paginación CU-04:** Mis actividades y sus intentos todavía cargan listas completas. Esto incumple la paginación prevista en el contrato y puede producir respuestas grandes o truncamiento por el límite de PostgREST. No se declara resuelto ni se relaja el contrato: implementar listado paginado y detalle con intentos paginados en un cambio posterior. Los filtros por estado del Miembro actúan sobre lo cargado; no equivalen a filtrar todo un conjunto paginado en servidor.
- **Rendimiento:** no se midieron los RNF en entorno desplegado. Aprobar las suites locales no acredita esos tiempos ni todos los RNF del producto.
- **Entornos de los compañeros:** las guías individuales registran Node 26/Podman o Windows y sus diferencias. La validación conjunta usa el entorno aprobado de Node 24/Docker; no modifica scripts para otros entornos en este alcance.
- **Salud y reportes:** sin algoritmo ni clasificación inventados; CU-05/06 continúan pendientes.
- **Operación:** Cloud, despliegue, programación remota de limpieza diaria y ejecución de GitHub Actions no se realizaron. Los avisos de dependencias registrados en la [integración UI/BD](integracion-ui-bd.md#dependencias-pendientes-de-seguimiento) siguen siendo un seguimiento separado; no se aplicó `audit fix --force`.
