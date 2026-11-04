# Guía de Supabase para desarrollar QAlly

**Alcance:** entorno local de datos, Auth y Storage. El diseño sigue ADR-001/002; salud permanece Sin evaluar. La primera ejecución descarga imágenes Docker. El proyecto compartido en Cloud se pospone por indicación del usuario, que todavía no dispone de él.

## Requisitos y primera ejecución

Usar Node.js 24 y Docker funcionando. Las herramientas del proyecto se instalan con npm y el lockfile versionado, sin instalaciones globales:

```sh
npm ci
npm run db:start
npm run db:seed
npm run db:types
npm run db:lint
npm run typecheck
```

`db:start` prepara una red Docker con puertos publicados solo en 127.0.0.1, inicia PostgreSQL/Auth/Storage/Studio y genera `.env.local` sin mostrar claves. El registro público queda deshabilitado en `[auth].enable_signup`; `[auth.email].enable_signup` mantiene activo el proveedor para permitir iniciar sesión a las cuentas existentes. No inicia Next.js: la UI se inicia aparte con `npm run dev -- --hostname 127.0.0.1` y ya conecta CU-01 a CU-04 con estas cuentas y datos locales. Las herramientas son locales y no requieren login ni cuenta Supabase Cloud.

Abrir **http://127.0.0.1:54323** para Studio. Allí se pueden inspeccionar tablas, usuarios de Auth y objetos Storage. API local: http://127.0.0.1:54321. No editar allí el esquema como fuente de verdad: los cambios se hacen en migraciones versionadas.

### Un clon nuevo en la misma computadora reutiliza la base

La configuración versionada fija `project_id = "qally"`. Supabase conserva los datos en el volumen Docker `supabase_db_qally` y los archivos en `supabase_storage_qally`, fuera de la carpeta del repositorio. Clonar QAlly en otra carpeta de la misma computadora y usar el mismo Docker reutiliza esa instancia y sus datos; no equivale a una base vacía. Parar Supabase o eliminar una carpeta del código tampoco elimina esos volúmenes.

`db:start` inicia esa instancia y aplica migraciones; no ejecuta pruebas. `db:seed` crea únicamente los tres ejemplos de forma repetible; `db:seed:team` agrega la captura de QAlly si falta. Ninguno elimina los proyectos que ya existían. Si aparecen proyectos de integración o de salud en un clon nuevo, comprobar si ya estaban en el volumen o si se ejecutó `db:test`/E2E. El bloque de primera ejecución ya no incluye `db:test`: las pruebas son un paso separado que agrega datos.

No usar reset para aislar un clon: afectaría también a los otros clones que utilizan esta instancia. Una instancia por clon requeriría configurar identificador, puertos y scripts administrativos compatibles; no basta con renombrar la carpeta.

## Credenciales locales

`.env.local` se genera con permisos de archivo restringidos y está ignorado por Git. Contiene URL, clave de cliente, credencial privilegiada de servidor, contraseña aleatoria de cuentas ficticias y clave de cifrado de la captura de reportes de CU-06 (`REPORT_SNAPSHOT_KEY_BASE64`, 32 bytes, solo servidor; se genera si falta y se conserva si existe). `.env.example` solo documenta sus nombres.

La contraseña se consulta en tu archivo local; no pegarla en el chat, commits, capturas compartidas ni logs. La credencial de servidor no lleva prefijo `NEXT_PUBLIC_` y nunca se entrega al navegador. `npm run db:status` muestra solo direcciones; `npm run db:env` vuelve a obtener las credenciales locales sin imprimirlas y conserva contraseña/clave de reporte existentes.

## Qué contiene el seed

| Cuenta local | Rol | Acceso inicial |
|---|---|---|
| qa1@qally.example.test | QA | Proyecto A y proyecto cerrado. |
| qa2@qally.example.test | QA | Proyecto B. |
| miembro1@qally.example.test | Miembro del equipo | Proyecto A; responsable de ejemplos. |
| miembro2@qally.example.test | Miembro del equipo | Proyecto A y cerrado. |
| miembro3@qally.example.test | Miembro del equipo | Proyecto B. |
| miembro4@qally.example.test | Miembro del equipo | Proyecto B. |

Se crean mediante Auth Admin API; no se insertan contraseñas ni filas de Auth manualmente. El script rechaza cualquier destino que no sea `http://127.0.0.1:54321`. Identificadores y claves de solicitud reproducibles evitan duplicados al repetirlo. No utilizar estas cuentas ni datos ficticios en producción.

Los tres proyectos incluyen configuraciones de métricas; A muestra las diez actividades, estados Pendiente/En progreso/En revisión/Aprobada y devolución con observaciones, enlaces y PDF de ejemplo. Tiene dos mediciones de cada métrica, un denominador cero y una corrección de medición antigua. El proyecto cerrado conserva consultas y bloquea escrituras de negocio.

Los **catálogos obligatorios** están en la migración `20261018000300_catalogos.sql`: así también se instalan al aplicar migraciones en Cloud. `seed.sql` no depende de cuentas inexistentes. `scripts/seed-dev.mjs` añade por separado las identidades y ejemplos locales después de aplicar el esquema.

## Trabajo cotidiano y reconstrucción

### Copiar el proyecto QAlly del equipo

El comando adicional restaura una captura del proyecto **QAlly** registrado localmente, tomada el 2026-11-04. En cada equipo, después de obtener esta rama e instalar las dependencias con `npm ci`:

```sh
npm run db:start
npm run db:seed:team
npm run dev -- --hostname 127.0.0.1
```

No requiere ejecutar el seed de ejemplos. Provisiona las seis cuentas locales habituales y restaura el proyecto con sus dos miembros, diez actividades SQA (siete Aprobadas y tres En progreso), diez entregas, siete evidencias (seis enlaces y un PDF), cuatro métricas y tres mediciones con sus revisiones. No genera mediciones para M-03. Acceso con `qa1@qally.example.test`, `miembro1@qally.example.test` o `miembro2@qally.example.test` y la contraseña `QALLY_DEV_PASSWORD` de **cada equipo**. `qa2` y los otros miembros no participan en este proyecto.

La captura está en `scripts/fixtures/proyecto-equipo/`: datos del proyecto y PDF, sin cuentas de Auth, contraseñas, sesiones ni claves. El PDF se carga al bucket privado `evidencias`; los enlaces conservan los permisos que tengan en su proveedor externo. Es una copia de desarrollo independiente: los cambios posteriores de un integrante no se sincronizan con los demás.

El seed conserva identificadores y fechas de negocio. Si el proyecto ya existe por su ID, termina sin modificarlo ni reponer sus archivos; no sobrescribe avances locales. Otros proyectos con el mismo nombre no se consideran la misma copia. Las mediciones conservan su orden relativo y reciben el número de secuencia propio de la base de destino. La carga SQL se hace en una transacción, con constraints y triggers activos, mediante `psql` del contenedor local `supabase_db_qally`; no cambia esquema, contratos, RLS ni migraciones. Necesita Docker accesible desde la terminal.

Los PDF se validan por tamaño y SHA-256 antes de cargar. Si falla la transacción, no quedan filas parciales del proyecto; puede quedar el binario previamente cargado. Al repetir, se comprueba su hash y se reutiliza sin sobrescribirlo. No ejecutar limpieza administrativa entre un fallo de importación y su reintento. El comando rechaza destinos ajenos al Supabase local de QAlly.

`npm run db:seed` sigue creando solo los tres proyectos ficticios; puede coexistir con este comando. Tras una reconstrucción voluntaria de la base, ejecutar otra vez `npm run db:seed:team` recupera esta captura. No hace falta resetear para incorporarla a una base existente.

Las pruebas `tests/database/seed-team.test.mjs` importan una copia con identificadores aislados y comprueban restauración de datos/historial/PDF, privacidad y acceso por proyecto, repetición sin sobrescritura y rollback ante una restricción inválida. Añaden un proyecto identificado como prueba, igual que el resto de pruebas de integración; no modifican el proyecto original.

```sh
npm run db:start
npm run db:status
npm run db:stop
```

`db:start` inicia los servicios y aplica las migraciones versionadas pendientes con `supabase migration up --local` antes de generar el entorno. Ejecutarlo también después de actualizar `dev`, aunque Supabase ya esté iniciado. Si una migración falla, el comando termina con error y no anuncia que el entorno está listo.

Si Métricas muestra un error Zod por ausencia de `cumplimientoCritico` o `aporte`, la BD todavía devuelve el contrato anterior a la migración `20261102000100_dec25_28_salud_reportes.sql`. Salud y la generación de reportes también necesitan esa migración. Ejecutar `npm run db:start` y recargar la aplicación; no resolverlo haciendo opcionales esos campos ni reiniciando los datos.

Parar conserva los datos. Para reconstruir **solo la base local de QAlly**, perdiendo sus datos de desarrollo:

```sh
npm run db:reset -- --confirm-local-reset
npm run db:seed
npm run db:types
```

El reset exige confirmación explícita en el argumento y usa `--local`; no hay un script de reset remoto. Esto no limpia por sí solo cualquier binario huérfano del almacén: consultar el estado de Storage y usar el protocolo de limpieza. No borrar a mano objetos que estén referenciados por entregas.

Para añadir cambios de BD después de compartir estas migraciones, crear otra migración; no reescribir el historial aplicado por otros integrantes. Revisar el cambio contra el diccionario/contratos aprobados y pedir aprobación si altera esas reglas. Generar y versionar de nuevo los tipos después de aplicar el cambio.

## Archivos y operación

Bucket `evidencias`, privado, máximo 3 MiB y MIME application/pdf. Usuarios normales no escriben directamente en Storage; un adaptador de servidor valida bytes, identidad y actividad, reserva un objeto único y confirma su referencia. Las RPC técnicas son exclusivas del servidor. El adaptador para scripts está en `scripts/lib/files.server.mjs`; CU-04 dispone además de `src/features/evidences/server/archivos.ts` y handlers Next.js para subida/descarga. Ambos son de servidor; nunca importar el adaptador privilegiado desde una interfaz cliente.

```sh
npm run db:cleanup
```

Este procedimiento administrativo procesa lotes de hasta 100 archivos sin referencias; limpieza ordinaria tras 24 horas y reserva expirada. Un archivo compartido por varios intentos no se borra. Reintenta registros Eliminando cuando se interrumpió un borrado. Durante desarrollo, el responsable lo ejecuta diariamente cuando utiliza archivos; automatizarlo en producción será una decisión operativa posterior.

## Pruebas y dataset grande

`npm run db:test` es una verificación opcional, separada del arranque y los seeds. Usa la API local y sesiones reales. Verifica Auth, RLS, escritura directa prohibida, accesos entre proyectos, altas atómicas/idempotentes, estados, revisiones/correcciones concurrentes, bloqueo de cierre, validación y privacidad de PDF y limpieza segura. Las pruebas añaden proyectos de integración, salud y restauración que permanecen en la base y se acumulan al repetirlas. También serán visibles desde otros clones conectados a la misma instancia. No ejecutar reset para quitarlos si hay datos de trabajo que se quieren conservar.

Para el dataset de aceptación grande:

```sh
npm run db:seed:large
```

Amplía el proyecto A a 1000 actividades y 1000 mediciones por cada una de las cuatro métricas, conservando el historial de ejemplo. Es una carga opcional repetible, no parte de cada arranque. No representa una prueba de tiempos de interfaz ni PDF de reportes. Las pruebas de navegador de CU-01 a CU-04 y sus límites se registran en la guía de integración conjunta.

El workflow `.github/workflows/database.yml` reproduce inicio, seeds, lint, pruebas, generación de tipos en CI; el workflow `application.yml` verifica lint, tipos de rutas/TypeScript y build de la aplicación, sin secretos de Cloud. Su ejecución en GitHub requiere push/PR y no se presume realizada localmente.

## Conexión futura a Supabase Cloud

Todavía no se ha creado ni enlazado un proyecto remoto. Cuando el equipo lo solicite:

1. Crear una organización/proyecto de **desarrollo**, elegir región y guardar privadamente su contraseña de BD. Confirmar versión mayor PostgreSQL compatible con la configuración local (17), referencia y si el proyecto está vacío.
2. Iniciar sesión en CLI con `npx supabase login` y enlazar el destino identificado con `npx supabase link --project-ref REFERENCIA`. Introducir credenciales de manera interactiva, sin argumentos que queden en historial ni pegarlas en el chat.
3. Revisar `npx supabase db push --linked --dry-run --skip-vault`. Una vez confirmado el contenido, aplicar `npx supabase db push --linked --skip-vault`. No incluir seed de desarrollo ni ejecutar reset remoto.
4. Configurar Auth en el panel sin registro público y crear las cuentas reales mediante invitación/provisionamiento controlado. Crear/validar bucket `evidencias` privado, 3 MiB, PDF; las políticas ya forman parte de migraciones. Revisar y aplicar configuración remota de Auth/Storage expresamente: no asumir que subir SQL replica config.toml.
5. Configurar los secretos del servidor y la clave pública del cliente en el entorno correspondiente. No copiar la contraseña ni las cuentas de desarrollo local a producción.
6. Repetir pruebas de acceso e integridad en un proyecto de pruebas autorizado antes de usar datos reales. Invitar al equipo a la organización/proyecto mediante el panel, sin compartir claves privilegiadas.

Los comandos de enlace/publicación anteriores están preparados para ese momento; no se han ejecutado contra Cloud. La UI Next.js de CU-01 a CU-04 está integrada en `dev`, con sesiones reales, operaciones de servidor y RLS. [Estado, pruebas conjuntas y limitaciones](../equipo/integracion-cu02-cu03-cu04.md). Salud y reportes siguen pendientes.

## Usar las cuentas desde la aplicación

Tras iniciar Supabase y ejecutar el seed, abrir Next.js con `npm run dev -- --hostname 127.0.0.1`. Entrar con una cuenta de la tabla y la contraseña `QALLY_DEV_PASSWORD` del archivo local. No hay registro público ni acceso con cualquier contraseña. QA ve solo sus proyectos; Miembro consulta los suyos. Las operaciones ordinarias de CU-01 a CU-04 se guardan con la sesión del usuario. El adaptador administrativo de PDF de CU-04 verifica primero autorización y utiliza la credencial de servicio solo en servidor; las descargas conservan identidad de usuario y RLS.

Las pruebas E2E añaden cuentas `e2e-miembro-*`, proyectos de paginación y proyectos aislados de cada ejecución. Son fixtures de prueba locales; el seed ordinario sigue creando sus seis cuentas y tres proyectos. No ejecutar reset para probar CU-01 salvo que se quiera borrar expresamente la base local.

## Estado comprobado

Bootstrap local terminado el 2026-10-18: seis migraciones, catorce tablas con RLS, seeds normal/grande repetidos, reconstrucción desde cero y **20 pruebas de integración aprobadas**. SQL lint y typecheck sin errores; tipos regenerados sin diferencias. Proyecto A: 1000 actividades y 1000 mediciones por métrica. [Registro de validación y límites](plan-bootstrap-supabase.md#resultado-de-ejecución-local--2026-10-18).

Supabase permanece iniciado para trabajar en Studio. Cloud no está enlazado y la rama no se ha publicado. El workflow queda preparado para cuando se publique la rama.

## Fuentes

[Configuración CLI](https://supabase.com/docs/guides/local-development/cli/config), [CLI oficial](https://supabase.com/docs/guides/local-development/cli/getting-started), [migraciones](https://supabase.com/docs/guides/deployment/database-migrations), [seeds](https://supabase.com/docs/guides/local-development/seeding-your-database), [Auth Admin](https://supabase.com/docs/reference/javascript/auth-admin-createuser). Reglas de QAlly: [diccionario](diccionario-datos.md), [seguridad](seguridad-integridad.md) y [contratos](../arquitectura/contratos-v1.md).
