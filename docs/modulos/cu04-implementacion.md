# CU-04 — Implementación y validación local

**Fecha: 2026-10-19. Estado: implementado y validado localmente** en la rama `feat/cu04-entrega-evidencias`, integrado en `dev` mediante `8fb64b4`, con revisión de pares pendiente. Fuente de alcance: [CU-04](../requisitos/casos-uso/CU-04.md), RF-20 a RF-25/RF-33, RNF asociados, [contratos v1](../arquitectura/contratos-v1.md) §5 y [seguridad e integridad](../datos/seguridad-integridad.md). Sin nuevas migraciones, dependencias ni cambios de reglas de negocio: se reutilizan las RPC, RLS, bucket privado y protocolo de reserva aprobados.

**Actualización de integración:** este registro conserva los resultados individuales de la rama. CU-02, CU-03 y CU-04 se reúnen posteriormente con CU-01; consultar [resoluciones, pruebas conjuntas y pendientes actuales](../equipo/integracion-cu02-cu03-cu04.md). Las referencias a otro CU sin interfaz describen el estado previo a esa integración.

## Uso local

Igual que [CU-01](cu01-implementacion.md). Con el seed, `miembro1@qally.example.test` tiene actividades Pendiente, En progreso (con PDF y enlace), En revisión, Aprobada y devuelta en el proyecto «QAlly demo A». Abrir **Mis actividades**.

La asignación de responsable y la revisión por QA pertenecen a CU-03 y ya están conectadas en `dev`, desde la pestaña Actividades del proyecto. El seed sigue ofreciendo ejemplos para probar sin crear una actividad nueva.

## Realización técnica

- `src/features/evidences/server/queries.ts`: lectura con la sesión del usuario y RLS de las actividades **asignadas al usuario**, con tipo, proyecto, intentos por número descendente, evidencias (sin rutas de Storage) y revisión. Los nombres de autores/revisores se resuelven en una sola consulta. Una actividad inexistente, ajena o no asignada se trata igual (NO_DISPONIBLE).
- `src/features/evidences/actions.ts`: Server Actions con validación Zod estricta (`validation.ts`) y versión esperada en cada escritura: `iniciar_actividad` (SF-01; además prepara el intento 1), `preparar_entrega` (SF-02: copia resultado y referencias del intento devuelto), `guardar_resultado`, `agregar_enlace`, `quitar_evidencia` y `enviar_entrega`. Antes de enviar se indica qué falta (FE-02) y la RPC vuelve a validarlo en el commit. Cada acción devuelve la actividad releída del servidor; la UI solo muestra éxito tras esa confirmación.
- `POST /api/entregas/{entregaId}/evidencias/pdf`: exige `Origin` presente y del mismo host, `Content-Type: application/pdf`, cabeceras `X-Nombre-Archivo`/`X-Version-Actividad`, cuenta bytes reales hasta 3 MiB (413 si se excede), valida sufijo, `%PDF-` y `%%EOF`, calcula SHA-256 y verifica con la sesión del usuario que es responsable, autor del borrador y que la actividad está En progreso. Después usa el adaptador privilegiado (`src/lib/supabase/admin.ts`, solo servidor) para `reservar_archivo` → subida sin upsert → `confirmar_archivo`. Solo un rechazo conocido activa la compensación inmediata (`marcar_limpieza` con ID, borrado, `confirmar_eliminacion`); un resultado ambiguo conserva el archivo para la limpieza ordinaria.
- `GET /api/evidencias/{evidenciaId}/archivo`: autoriza en cada solicitud con la sesión del usuario y la política RLS de Storage (también en proyecto cerrado); responde como adjunto con nombre saneado, `Cache-Control: private, no-store` y `X-Content-Type-Options: nosniff`. Inexistente o ajeno → 404 indistinguible.
- `src/proxy.ts` incluye `/api/*` para renovar la sesión. `TAMANO_EXCEDIDO` se añadió a los mensajes públicos ya definidos por los contratos.
- UI existente reutilizada: lista con filtros por estado, detalle en panel lateral, observaciones de QA, intentos enviados inmutables y editor de evidencias. Ahora cada alta/baja de evidencia se guarda al momento; varios PDF se suben con transferencias individuales. Los PDF de intentos se descargan con «Descargar».

## Pruebas reproducibles

Mismos comandos que CU-01 (`npm run unit:test`, `db:test`, `typecheck`, `lint`, `e2e:test`). E2E crea un proyecto aislado por escenario con `miembro2`.

## Resultado comprobado (Windows 11, Node 24.21.0, Docker 29.8.2)

- **25 pruebas unitarias** (4 nuevas de CU-04: enlaces, nombre/formato/tamaño de PDF, normalización de resultado, entradas estrictas y versiones).
- **20 pruebas de integración de BD** sin cambios, aprobadas.
- **22 escenarios E2E** en Chrome for Testing y Firefox de Playwright: los 18 de CU-01 más 4 de CU-04 (2 por navegador):
  - iniciar (SF-01), faltantes indicados (FE-02), enlace y archivo inválidos rechazados (FE-03), PDF y enlace adjuntados, envío a En revisión, persistencia tras recargar, descarga privada con cabeceras, devolución de QA, corrección en intento 2 con datos copiados y el intento 1 intacto (SF-02);
  - subida por otro miembro (404), sin `Origin` u otro origen (403), sin sesión (401), lista sin actividades ajenas, sin evidencias creadas por intentos rechazados y proyecto cerrado en solo lectura.
- Lint y TypeScript aprobados.

## Límites y pendientes

- RNF-04/05/06: sin mediciones de tiempos en entorno desplegado (igual que CU-01).
- En la validación individual no se probó la pérdida de respuesta de subida ni la compensación desde la aplicación. La integración posterior añadió E2E de respuesta perdida tras persistir y unitarias con fallos de Storage/RPC; la BD ya prueba compensación y archivos compartidos. No se simuló una caída física del servicio. [Cobertura conjunta](../equipo/integracion-cu02-cu03-cu04.md#resultados-de-la-integración).
- Lista de Mis actividades sin paginación ni paginación de intentos (contrato §2); suficiente para los datos actuales, pendiente si un miembro acumula muchas asignaciones.
- El historial de eventos de la actividad no existe en el modelo aprobado; no se muestra.
- `npm run db:start`/`db:lint` fallan en Windows porque `scripts/db.mjs` invoca `supabase.cmd` sin shell (restricción de Node). Problema previo y ajeno a CU-04: aquí se ejecutó el CLI directamente. Conviene corregirlo aparte.
- No se hizo push ni despliegue.
