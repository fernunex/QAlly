# CU-03 — Implementación y validación local

**Fecha: 2026-10-19. Estado: implementado; validación local en `feat/cu-03-actividades`, pendiente de revisión e integración en `dev`.** Fuente de alcance: [CU-03](../requisitos/casos-uso/CU-03.md), RF-15 a RF-19/RF-33, RNF asociados y [contratos v1](../arquitectura/contratos-v1.md) §5. Sin nuevas migraciones ni cambios de reglas de negocio.

**Actualización de integración:** este registro conserva los resultados individuales de la rama. CU-02, CU-03 y CU-04 se reúnen posteriormente con CU-01; consultar [resoluciones, pruebas conjuntas y pendientes actuales](../equipo/integracion-cu02-cu03-cu04.md). Las referencias a otro CU sin interfaz describen el estado previo a esa integración.

## Uso local

Igual que [CU-01](cu01-implementacion.md#uso-local). En el proyecto «QAlly demo A» (cuenta `qa1@qally.example.test`) el seed deja actividades Pendiente, En progreso, En revisión (A-05, con enlace), Aprobada y devuelta con observaciones; `miembro1` es su responsable. La entrega desde la cuenta de Miembro corresponde a CU-04 y aún no está conectada: para revisar nuevos intentos se preparan con los scripts locales o las RPC.

QA participante en un proyecto abierto puede, desde la pestaña **Actividades**:

- **SF-01** agregar una actividad del catálogo vigente con descripción específica; se crea Pendiente, sin responsable, y un tipo puede repetirse.
- **SF-02** abrir el detalle: descripción, tipo/etapa, responsable, estado, criterio y evidencia esperada del catálogo, intento vigente con resultado y evidencias, historial de intentos (paginado de 10 en 10), observaciones de devoluciones y línea de tiempo.
- **SF-03** asignar o cambiar el responsable de una actividad Pendiente entre los miembros del proyecto, sin cambiar el estado.
- **SF-04** aprobar el intento En revisión tras confirmación; se registran QA y fecha. Observaciones opcionales.
- **SF-05** devolver con observaciones obligatorias; la actividad vuelve a En progreso con las observaciones visibles.

Miembro consulta el mismo tablero y detalle en solo lectura. En proyecto cerrado todos los participantes solo consultan.

## Realización técnica

- `src/features/activities/server/queries.ts`: lecturas con la sesión del usuario y RLS. `consultarTablero` obtiene la primera página (25) de cada estado con su total exacto; `listarActividades` continúa una columna por cursor (`creado_en DESC, id DESC`). Filtros de etapa y responsable en servidor, según la [ampliación aprobada del contrato](../arquitectura/contratos-v1.md#5-actividades-entregas-y-evidencias). Cada fila incluye solo el último intento enviado y su decisión; el detalle se consulta aparte.
- `consultarActividad` devuelve intentos **enviados** e inmutables por número descendente, con evidencias y revisión. El borrador en preparación pertenece al responsable (CU-04) y no se expone. La línea de tiempo se deriva de datos persistidos (alta, envíos, revisiones); no existe tabla de eventos, por lo que asignación e inicio no aparecen con fecha.
- `src/features/activities/actions.ts`: Server Actions con autorización QA/participación/proyecto abierto en servidor, validación estricta Zod (`validation.ts`) y llamadas a `agregar_actividad`, `asignar_responsable` y `revisar_entrega` con decisión fija por acción. Las RPC vuelven a autorizar con `auth.uid()`. Versiones bigint como cadena; una versión obsoleta devuelve CONFLICTO sin sobrescribir ni duplicar revisiones. Un ID inexistente o ajeno devuelve NO_DISPONIBLE (FE-01) con mensaje de actividad.
- `GET /api/evidencias/{evidenciaId}/archivo` (contrato §5): autoriza evidencia/archivo por RLS y descarga desde Storage con la identidad del usuario (política `evidencia_pdf_lectura`), sin ruta enviada por el cliente. Respuesta adjunta con nombre saneado, `Cache-Control: private, no-store` y `nosniff`; 401 sin sesión y 404 para inexistente/ajeno. El proxy también renueva sesión en esta ruta. La subida de PDF sigue en CU-04.
- UI existente reutilizada: tablero, tarjetas, diálogos de alta/asignación y hoja de detalle se conectan a las acciones sin guardados simulados. Catálogo con IDs de BD (`listarCatalogos`). Alta con respuesta ambigua bloquea el reenvío y pide recargar (contrato §5); los conflictos ofrecen «Recargar información». FE-03/FE-04 se validan en cliente y servidor.

Cambios en piezas compartidas, todos aditivos: `ErrorAccion` admite `onRecargar`; `texto`/`opcional` de la validación de proyectos se exportan; `ActividadResumen` en `domain.ts`; matcher del proxy incluye `/api/evidencias`; `EvidenciaItem` descarga el PDF real («Descargar»). La tabla paginada de actividades configuradas de CU-01 permanece en el resumen del proyecto; la pestaña Actividades pasa a ser el tablero.

## Pruebas reproducibles

```sh
npm run unit:test
npm run db:test
npm run typecheck
npm run lint
npm run e2e:test
```

`tests/e2e/cu03.spec.ts` crea proyectos aislados por ejecución mediante RPC y prepara intentos En revisión como responsable (incluido un PDF por el adaptador local de servidor). Las E2E añaden decenas de proyectos ficticios a la BD local y relegan los proyectos del seed a las últimas páginas del listado; tras ejecutarlas, reconstruir para volver a probar manualmente: `npm run db:reset -- --confirm-local-reset && npm run db:seed`.

## Resultado comprobado

- **32 pruebas unitarias aprobadas** (11 nuevas de CU-03): normalización, propiedades ajenas, versiones bigint exactas, observaciones obligatorias/opcionales, filtros aprobados y desconocidos, cursor de intentos.
- **20 pruebas de integración de BD aprobadas**, sin modificar migraciones; SQL lint sin errores y tipos regenerados sin diferencias.
- **28 escenarios E2E aprobados** (18 de CU-01 y 10 de CU-03: cinco por navegador) con Chrome for Testing de Playwright y Firefox 157.0, en Linux x86_64 local con Node 26.11.1. Suite completa: 2,5 minutos; no son tiempos por operación RNF.
- Se verifica alta con validación y tipo repetido, asignación persistente sin cambio de estado, devolución sin/con observaciones, aprobación con confirmación y revisión registrada con QA, decisión repetida/versión obsoleta con CONFLICTO, conflicto entre pestañas sin sobrescritura, paginación por columna (25 de 30 → 30, sin duplicados), filtros por URL y desconocidos ignorados, proyecto cerrado en solo lectura, llamadas directas como Miembro (PROHIBIDO), QA ajeno (NO_DISPONIBLE) y sin sesión (SIN_SESION), y descarga PDF con cabeceras privadas (404 ajeno/inexistente, 401 sin sesión).
- Typecheck, lint y build de producción aprobados.

Corrección incluida: el `aria-labelledby` de las columnas usaba ids con espacios («col-En revisión») y dejaba sin nombre accesible a «En progreso» y «En revisión»; ahora usa `useId`. `mis-actividades-lista.tsx` (CU-04) conserva el mismo patrón y debe corregirse al conectar ese CU.

**Entorno de esta validación:** Podman 6.1.3 sin privilegios en lugar de Docker, mediante su socket compatible (`DOCKER_HOST`). `npm run db:start` no funciona tal cual con Podman: netavark no admite la opción `host_binding_ipv4` y el formato de `network inspect` difiere, por lo que Supabase se inició con la CLI y `--network-id qally-local`; la prueba de bloqueo de BD necesitó un alias temporal `docker → podman`. Con Podman los puertos 54321–54324 quedan publicados en `0.0.0.0`, no solo en loopback: depender del firewall del equipo o usar Docker para conservar la restricción de la guía. Node 26 en lugar de 24 (aviso de engines, sin fallos). No se hizo push ni despliegue remoto.
