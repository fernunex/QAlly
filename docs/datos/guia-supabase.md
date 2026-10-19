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
npm run db:test
npm run typecheck
```

`db:start` prepara una red Docker con puertos publicados solo en 127.0.0.1, inicia PostgreSQL/Auth/Storage/Studio y genera `.env.local` sin mostrar claves. El registro público queda deshabilitado en `[auth].enable_signup`; `[auth.email].enable_signup` mantiene activo el proveedor para permitir iniciar sesión a las cuentas existentes. No inicia Next.js: la UI se inicia aparte con `npm run dev -- --hostname 127.0.0.1` y conserva datos de demostración hasta conectar los casos de uso. Las herramientas son locales y no requieren login ni cuenta Supabase Cloud.

Abrir **http://127.0.0.1:54323** para Studio. Allí se pueden inspeccionar tablas, usuarios de Auth y objetos Storage. API local: http://127.0.0.1:54321. No editar allí el esquema como fuente de verdad: los cambios se hacen en migraciones versionadas.

## Credenciales locales

`.env.local` se genera con permisos de archivo restringidos y está ignorado por Git. Contiene URL, clave de cliente, credencial privilegiada de servidor, contraseña aleatoria de cuentas ficticias y clave futura de captura de reportes. `.env.example` solo documenta sus nombres.

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

```sh
npm run db:start
npm run db:status
npm run db:stop
```

Parar conserva los datos. Para reconstruir **solo la base local de QAlly**, perdiendo sus datos de desarrollo:

```sh
npm run db:reset -- --confirm-local-reset
npm run db:seed
npm run db:types
```

El reset exige confirmación explícita en el argumento y usa `--local`; no hay un script de reset remoto. Esto no limpia por sí solo cualquier binario huérfano del almacén: consultar el estado de Storage y usar el protocolo de limpieza. No borrar a mano objetos que estén referenciados por entregas.

Para añadir cambios de BD después de compartir estas migraciones, crear otra migración; no reescribir el historial aplicado por otros integrantes. Revisar el cambio contra el diccionario/contratos aprobados y pedir aprobación si altera esas reglas. Generar y versionar de nuevo los tipos después de aplicar el cambio.

## Archivos y operación

Bucket `evidencias`, privado, máximo 3 MiB y MIME application/pdf. Usuarios normales no escriben directamente en Storage; un adaptador de servidor valida bytes, identidad y actividad, reserva un objeto único y confirma su referencia. Las RPC técnicas son exclusivas del servidor. El adaptador local ejecutable está en `scripts/lib/files.server.mjs`; no es un endpoint Next.js ni debe importarse desde una interfaz cliente.

```sh
npm run db:cleanup
```

Este procedimiento administrativo procesa lotes de hasta 100 archivos sin referencias; limpieza ordinaria tras 24 horas y reserva expirada. Un archivo compartido por varios intentos no se borra. Reintenta registros Eliminando cuando se interrumpió un borrado. Durante desarrollo, el responsable lo ejecuta diariamente cuando utiliza archivos; automatizarlo en producción será una decisión operativa posterior.

## Pruebas y dataset grande

`db:test` usa la API local y sesiones reales. Verifica Auth, RLS, escritura directa prohibida, accesos entre proyectos, altas atómicas/idempotentes, estados, revisiones/correcciones concurrentes, bloqueo de cierre, validación y privacidad de PDF y limpieza segura. Las pruebas añaden proyectos de integración locales; reconstruir si se desea descartarlos.

Para el dataset de aceptación grande:

```sh
npm run db:seed:large
```

Amplía el proyecto A a 1000 actividades y 1000 mediciones por cada una de las cuatro métricas, conservando el historial de ejemplo. Es una carga opcional repetible, no parte de cada arranque. No representa una prueba de tiempos de interfaz, PDF de reportes o navegadores: faltan esos componentes.

El workflow `.github/workflows/database.yml` reproduce inicio, seeds, lint, pruebas, generación de tipos en CI; el workflow `application.yml` verifica lint, tipos de rutas/TypeScript y build de la aplicación, sin secretos de Cloud. Su ejecución en GitHub requiere push/PR y no se presume realizada localmente.

## Conexión futura a Supabase Cloud

Todavía no se ha creado ni enlazado un proyecto remoto. Cuando el equipo lo solicite:

1. Crear una organización/proyecto de **desarrollo**, elegir región y guardar privadamente su contraseña de BD. Confirmar versión mayor PostgreSQL compatible con la configuración local (17), referencia y si el proyecto está vacío.
2. Iniciar sesión en CLI con `npx supabase login` y enlazar el destino identificado con `npx supabase link --project-ref REFERENCIA`. Introducir credenciales de manera interactiva, sin argumentos que queden en historial ni pegarlas en el chat.
3. Revisar `npx supabase db push --linked --dry-run --skip-vault`. Una vez confirmado el contenido, aplicar `npx supabase db push --linked --skip-vault`. No incluir seed de desarrollo ni ejecutar reset remoto.
4. Configurar Auth en el panel sin registro público y crear las cuentas reales mediante invitación/provisionamiento controlado. Crear/validar bucket `evidencias` privado, 3 MiB, PDF; las políticas ya forman parte de migraciones. Revisar y aplicar configuración remota de Auth/Storage expresamente: no asumir que subir SQL replica config.toml.
5. Configurar los secretos del servidor y la clave pública del cliente en el entorno correspondiente. No copiar la contraseña ni las cuentas de desarrollo local a producción.
6. Repetir pruebas de acceso e integridad en un proyecto de pruebas autorizado antes de usar datos reales. Invitar al equipo a la organización/proyecto mediante el panel, sin compartir claves privilegiadas.

Los comandos de enlace/publicación anteriores están preparados para ese momento; no se han ejecutado contra Cloud. La UI Next.js ya está integrada; conectar sus sesiones SSR/Route Handlers, reportes y pruebas de aceptación Chrome/Firefox sigue siendo trabajo posterior al bootstrap de datos.

## Estado comprobado

Bootstrap local terminado el 2026-10-18: seis migraciones, catorce tablas con RLS, seeds normal/grande repetidos, reconstrucción desde cero y **20 pruebas de integración aprobadas**. SQL lint y typecheck sin errores; tipos regenerados sin diferencias. Proyecto A: 1000 actividades y 1000 mediciones por métrica. [Registro de validación y límites](plan-bootstrap-supabase.md#resultado-de-ejecución-local--2026-10-18).

Supabase permanece iniciado para trabajar en Studio. Cloud no está enlazado y la rama no se ha publicado. El workflow queda preparado para cuando se publique la rama.

## Fuentes

[Configuración CLI](https://supabase.com/docs/guides/local-development/cli/config), [CLI oficial](https://supabase.com/docs/guides/local-development/cli/getting-started), [migraciones](https://supabase.com/docs/guides/deployment/database-migrations), [seeds](https://supabase.com/docs/guides/local-development/seeding-your-database), [Auth Admin](https://supabase.com/docs/reference/javascript/auth-admin-createuser). Reglas de QAlly: [diccionario](diccionario-datos.md), [seguridad](seguridad-integridad.md) y [contratos](../arquitectura/contratos-v1.md).
