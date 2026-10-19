# Plan de bootstrap de datos con Supabase

**Fecha: 2026-10-18. Estado: ENTORNO LOCAL COMPLETADO Y VALIDADO; CLOUD POSPUESTO.** Responde a la solicitud de iniciar la implementación y explicar los requisitos para dejar la base preparada. No modifica el diseño aprobado por [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md) y [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). El plan se presentó antes de instalar; el usuario solicitó después «Realiza el plan completamente». Se ejecuta el bootstrap local sin cambios de diseño. Supabase Cloud se pospone por su respuesta «Todavía no; completa primero el entorno local». El resultado de validación se registra al final.

## Situación inicial comprobada (antes del bootstrap)

- Repositorio con diseño aprobado y sin aplicación, package.json, migraciones o configuración Supabase todavía.
- Disponibles en este equipo: Node.js 24.18.1, npm 12.0.2 y Docker con servidor 29.8.2 accesible.
- Supabase CLI no está instalado como comando global; se propone fijarlo como dependencia de desarrollo del proyecto, mediante npm y lockfile.
- La cuenta/proyecto remoto del usuario no se presupone. El entorno local puede iniciarse sin ellos. No enlazar ni modificar un proyecto remoto hasta identificar expresamente el destino y la operación.

Docker se usa como herramienta disponible para validar localmente PostgreSQL, Auth y Storage. Esto no lo convierte en requisito obligatorio de producción ni cambia el stack Vercel + Supabase aprobado.

## Qué proporciona Supabase

| Servicio | Uso en QAlly |
|---|---|
| PostgreSQL | Tablas, relaciones, restricciones, índices y funciones transaccionales. |
| Auth | Cuentas, contraseñas y sesiones. Perfil y participación en proyectos siguen siendo datos de QAlly. |
| Storage | PDF en bucket privado; autorización y metadata conforme al diseño. |
| Studio | Interfaz de inspección de datos y servicios; no reemplaza migraciones como fuente de verdad. |
| CLI | Inicializar configuración local, levantar servicios, aplicar migraciones, probar y generar tipos. |

## Etapas y entregables

### 1. Herramientas y entorno local

Preparar una rama de trabajo y package.json privado mínimo para herramientas de datos. Instalar exclusivamente las dependencias necesarias del stack aprobado: Supabase CLI y, cuando sus scripts lo necesiten, Supabase JS, TypeScript, Zod y herramientas de pruebas aprobadas. Fijar versiones verificadas y package-lock.json; no instalar Next.js o todas las herramientas de interfaz solo para preparar datos.

Inicializar Supabase CLI con configuración versionada y servicios locales. Revisar puertos/red, limitar acceso local y confirmar que no se interfiera con otros contenedores/proyectos. La primera ejecución descarga imágenes. Preparar scripts npm reproducibles de inicio, parada, aplicación de migraciones, pruebas y generación de tipos. Documentar solamente comandos efectivamente comprobados.

Archivos previstos: package.json, package-lock.json, supabase/config.toml, .env.example y documentación de uso. Las credenciales locales van en archivo ignorado; nunca se registran claves de servidor, contraseñas o tokens en Git ni en logs de validación.

### 2. Migraciones del esquema y seguridad

Implementar las catorce tablas del [ER](modelo-entidad-relacion.md), tipos/límites del [diccionario](diccionario-datos.md), [detalle técnico](detalle-tecnico-v1.md) y [contratos](../arquitectura/contratos-v1.md).

Orden: identidad/perfil y etapas; catálogos; proyectos/participación; actividades/entregas/revisiones/archivos; métricas/mediciones/revisiones; índices y funciones/RLS correspondientes. Cada migración protege sus tablas desde su creación: no dejar un esquema funcional expuesto antes de añadir seguridad en otra iteración.

Incluir transacciones, idempotencia, versiones, correcciones inmutables, cierre y permisos por proyecto. No modificar tablas internas de Auth ni Storage como mecanismo de implementación. No agregar algoritmo de salud ni cambiar reglas ya aprobadas por conveniencia del SQL.

### 3. Datos iniciales y seeds

Separar tres categorías:

| Categoría | Contenido | Forma de aplicación |
|---|---|---|
| Datos de referencia del producto | Tres etapas, diez actividades con cinco preselecciones, cuatro métricas con definiciones/etapa Desarrollo y objetivos iniciales aprobados. | Inserción controlada y versionada que también acompañe despliegues remotos. Puede formar parte de una migración de datos de referencia; no depender exclusivamente de un seed local que no se ejecuta automáticamente al publicar. |
| Cuentas de desarrollo | QA y Miembros ficticios, perfiles asociados y credenciales solo locales. | Script de servidor mediante Auth Admin API, idempotente y restringido explícitamente al entorno de desarrollo. No insertar manualmente contraseñas/usuarios en tablas internas de Auth. |
| Ejemplos y dataset de pruebas | Proyectos aislados, uno cerrado, actividades, entregas, objetivos, mediciones y correcciones; dataset grande separado para rendimiento futuro. | Seed/script de desarrollo después de provisionar identidades, con IDs reproducibles y sin mezclarlo con datos obligatorios de producción. |

`supabase/seed.sql` es un mecanismo de datos iniciales para el flujo local, no un sustituto de migraciones ni del aprovisionamiento de Auth. Diseñar el orden de ejecución para que no dependa de IDs de usuarios todavía inexistentes. Un reset de desarrollo solo puede dirigirse a la base local identificada; nunca ejecutar un reset remoto por defecto.

### 4. Auth, Storage y operación

Configurar autenticación para las cuentas iniciales, permisos de perfil y participación; no añadir registro público de usuarios al producto. Configurar bucket privado evidencias, tamaño máximo 3 MiB, políticas de lectura y prohibición de escritura directa del cliente. Implementar las funciones técnicas de reserva/confirmación/limpieza con el aislamiento aprobado; el adaptador de servidor y su validación de bytes se verifican cuando exista el código correspondiente, sin asumir que una política SQL valida todo un PDF.

Preparar el procedimiento administrativo de limpieza y sus reintentos. Las claves privilegiadas solo las usan los scripts/adaptadores de servidor autorizados; el cliente normal conserva contexto de usuario y RLS.

### 5. Validación y tipos TypeScript

Probar reconstrucción desde cero local, constraints y catálogos; ejecutar RPC como QA/Miembro/usuario ajeno y sin sesión; verificar acceso cruzado a dos proyectos; historial/correcciones; transiciones; duplicidad de métricas; idempotencia del alta; cierre concurrente; límites y referencias de archivos.

Generar tipos TypeScript de la BD desde el esquema aplicado y versionarlos. No escribir tipos a mano como si reflejaran una BD no probada. Documentar qué pruebas quedan pendientes, especialmente transferencias de archivo, interfaz, Chrome/Firefox y rendimiento extremo a extremo, que requieren componentes todavía no implementados.

### 6. Proyecto compartido en Supabase Cloud

El usuario/equipo crea la organización y un proyecto de desarrollo en su cuenta; elige región y conserva la contraseña de BD de forma privada. Se identifica el proyecto de destino y si está vacío antes de enlazarlo. No solicitar que pegue secretos en el chat.

Solo después de validar localmente: revisar migraciones/configuración que se aplicarían y promoverlas al proyecto autorizado. No cargar ejemplos ni contraseñas de desarrollo en producción. Compartir acceso al panel mediante invitaciones de Supabase, sin añadir roles nuevos dentro de QAlly. Publicación remota y despliegue de la aplicación son pasos distintos.

## Criterio de «base lista»

La base queda preparada cuando el entorno local se reconstruye de forma reproducible, las migraciones y catálogos se aplican correctamente, las cuentas de prueba permiten validar los permisos reales, Auth/Storage están configurados, las pruebas de integridad/autorización pasan, los tipos están generados y el README explica el flujo comprobado.

«Local listo» no equivale a «nube configurada» ni a cumplimiento demostrado de todos los RNF. La conexión remota requiere un proyecto identificado; el algoritmo de salud sigue pendiente sin impedir este trabajo.

## Referencias oficiales

- [Desarrollo local](https://supabase.com/docs/guides/local-development).
- [Instalación y uso de CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
- [Seeds](https://supabase.com/docs/guides/local-development/seeding-your-database).

Las decisiones de QAlly provienen de sus ADR y documentos canónicos. Las referencias explican herramientas y no sustituyen esas reglas.

## Resultado de ejecución local — 2026-10-18

Se completaron las etapas 1–5; la etapa 6 permanece pospuesta expresamente por el usuario. Trabajo en `base/supabase-bootstrap`, sin commit/push ni cambios remotos.

- Seis migraciones aplicadas sobre Supabase PostgreSQL 17.11.0.004: catorce tablas, todas con RLS, restricciones/índices, funciones de negocio y funciones técnicas de archivos con privilegios separados.
- Auth v2.197.0, Storage v1.82.1 y PostgREST v16.4 funcionando; Studio disponible. Red `qally-local`; puertos publicados comprobados sobre 127.0.0.1. No se modificaron contenedores de otros proyectos.
- Catálogos obligatorios en migración; seis cuentas ficticias vía Auth Admin API; tres proyectos demo, uno cerrado, estados/entregas/evidencias y revisiones de mediciones. Seed normal y grande repetibles sin duplicación de ejemplos.
- Dataset grande comprobado por consulta SQL: proyecto A con 1000 actividades y exactamente 1000 mediciones M-01, M-02, M-03 y M-04. Las pruebas agregan sus propios proyectos separados.
- Reconstrucción efectiva con `npm run db:reset -- --confirm-local-reset`, aplicación de las seis migraciones, reprovisión de cuentas/ejemplos y servicios saludables. El comando conserva explícitamente la red local mediante `--network-id qally-local`.
- `npm run db:test`: **20/20 pruebas aprobadas**, también después del reset y de la carga grande; última ejecución 6,18 s. Incluye RLS con sesiones reales, registro público bloqueado, roles/proyectos, atomicidad/idempotencia, concurrencia, trazabilidad, estados, cierre, descarga privada, referencias compartidas y compensación/limpieza.
- `npm run db:lint`: sin errores; `npm run typecheck`: aprobado. Tipos generados desde la base aplicada en `src/lib/supabase/database.types.ts`; regeneración tras reset produjo exactamente el mismo archivo.
- `npm run db:cleanup` y `db:status` comprobados. `.env.local`, dependencias y estado de CLI ignorados por Git; las credenciales no se imprimen. Auditoría npm: cero vulnerabilidades reportadas.

Equipo/entorno: Linux x86_64 local, Node.js 24.18.1, npm 12.0.2, Docker Engine 29.8.2, Supabase CLI 2.121.0; solicitudes por loopback. Son pruebas de API/BD, sin navegador ni conexión Cloud. La duración de la suite no mide los umbrales RNF de operaciones/vistas.

Ajustes de configuración comprobados: el registro global de Auth está deshabilitado, mientras el proveedor email permanece activo para cuentas provisionadas. Los scripts que reinician PostgreSQL conservan la misma red Docker. Ambos ajustes realizan el diseño aprobado sin alterar reglas del producto.

No se implementaron aplicación Next.js, SSR, endpoints web, captura/exportación de reportes, algoritmo de salud ni pruebas Chrome/Firefox. El adaptador de archivos es una herramienta local de servidor probada contra Storage; deberá integrarse en el servidor Next.js con sus validaciones. Workflow de GitHub preparado pero no ejecutado remotamente. Cloud, región, cuentas reales y despliegue siguen pendientes de un destino identificado y autorizado.
