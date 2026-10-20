# Seguridad e integridad de QAlly

**Estado: APROBADO, 2026-10-18**, por [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md) y [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). Controles definitivos de diseño v1, sin políticas ni migraciones ejecutables. [ER](modelo-entidad-relacion.md), [diccionario](diccionario-datos.md), [detalle técnico](detalle-tecnico-v1.md), [contratos](../arquitectura/contratos-v1.md) y [RNF](../requisitos/no-funcionales.md).

## Identidad y autorización

1. Verificar la identidad de Supabase Auth en servidor, incluida expiración; no confiar solo en cookies presentes ni datos de sesión entregados por cliente.
2. Leer el rol global desde `perfil` protegido. No usar metadata editable por el usuario como fuente de privilegios.
3. Verificar participación explícita en el proyecto identificado por la entidad solicitada. Tener rol QA no habilita todos los proyectos.
4. Validar la operación, el estado y, cuando aplique, la identidad del responsable. Autor, fecha y proyecto efectivo se derivan en servidor/BD.
5. Aplicar RLS, privilegios mínimos, restricciones y transacciones también ante solicitudes directas. Ocultar botones no es un control de seguridad.

El QA puede crear un proyecto sin pertenencia previa porque todavía no existe; la operación verifica rol e inserta su participación en la misma transacción. Las cuentas y perfiles iniciales se provisionan mediante un procedimiento controlado de Auth; ningún usuario se asigna rol o membresía a sí mismo.

## Permisos funcionales

Todas las tablas de QAlly expuestas a la API tendrán RLS y privilegios revisados por operación. El rol técnico `authenticated` no equivale a QA. `anon` no tiene acceso funcional. «Autorizado» implica identidad válida más participación en el proyecto.

| Tabla/recurso | SELECT | Mutaciones |
|---|---|---|
| perfil | Perfil propio; datos mínimos de participantes del proyecto autorizado. QA dispone de consulta acotada de cuentas elegibles para alta inicial. | Sin autoservicio para crear/cambiar rol. Provisionamiento controlado. No exponer datos internos de Auth. |
| proyecto | Participantes autorizados, abierto o cerrado. | QA: alta; edición/cierre del proyecto abierto autorizado. |
| participacion_proyecto | Participantes del proyecto autorizado. | Alta inicial atómica por QA; sin autoasociación ni módulo de cambios posterior. |
| etapa y tipos de catálogo | Usuarios autenticados; tipos inactivos visibles si explican datos existentes. | Solo migraciones/semillas controladas, no usuarios de producto. |
| metrica_proyecto | Participantes autorizados. | QA del proyecto abierto; sin duplicados. |
| medicion y revision_medicion | Participantes autorizados del proyecto de la métrica. | QA del proyecto abierto por RPC específica; revisiones solo inserción; sin UPDATE/DELETE ordinarios. |
| actividad_sqa | Participantes autorizados. | QA crea/asigna/revisa; Miembro responsable inicia/entrega; solo proyecto abierto y transición válida. |
| entrega y evidencia | Participantes autorizados a la actividad. | Miembro responsable durante preparación; sin edición de intentos enviados. Al enviar se valida el conjunto. |
| revision_entrega | Participantes autorizados. | Inserción por QA sobre entrega vigente En revisión; sin modificación ordinaria. |
| Objetos Storage | Autorizados al proyecto y evidencia, o al borrador propio permitido. | El responsable solicita carga al servidor; sin escritura directa del navegador. Adaptador aislado con autorización explícita para subir; limpieza administrativa solo sin referencias. |
| Reporte | QA autorizado, también en proyecto cerrado. | No modifica datos de negocio. |

Las consultas del selector de cuentas no dan acceso a sus otros proyectos. Los detalles de acceso a perfiles deben evitar políticas recursivas perfil → participación → perfil; una función auxiliar acotada puede consultar pertenencia sin exponer datos ni permitir mutaciones.

## Privilegios, RLS y funciones

### Operaciones ordinarias

`anon` y `PUBLIC` sin privilegios de datos ni ejecución de funciones de QAlly. `authenticated` obtiene SELECT con RLS sobre tablas necesarias y EXECUTE únicamente de las RPC funcionales enumeradas en [contratos](../arquitectura/contratos-v1.md). Sin INSERT/UPDATE/DELETE directo sobre tablas de negocio. Roles/perfiles y catálogos solo se provisionan por procedimiento administrativo versionado.

Las RPC de escritura serán `SECURITY DEFINER`, con propietario de migración, `search_path` vacío, nombres calificados y sin SQL dinámico. Se revoca EXECUTE predeterminado a PUBLIC y se concede función por función. Cada RPC valida `auth.uid()`, perfil, proyecto, rol, estado, campos y versión; el contexto del servidor no reemplaza estos controles internos. Su acceso privilegiado se limita a las tablas/columnas codificadas en cada función; no se ofrece una RPC genérica de escritura.

Los helpers privados de políticas devuelven solo booleanos sobre la identidad corriente: `tiene_perfil()`, `participa(proyecto_id)`, `es_qa(proyecto_id)` y `es_responsable(actividad_id)`. Helpers de lectura acotados con propietario privilegiado evitan recursión de políticas sobre participación/perfil; nunca aceptan una identidad libre como sustituto de `auth.uid()`.

| Tabla | Predicado SELECT RLS, expresado conceptualmente |
|---|---|
| perfil | Usuario propio o participante de un proyecto compartido con el solicitante. El selector QA se hace por RPC separada, acotada a ID/nombre/rol de cuentas elegibles. |
| proyecto | `participa(id)`. |
| participacion_proyecto | `participa(proyecto_id)`. |
| etapas/tipos | `tiene_perfil()`; catálogo activo para nuevas selecciones, inactivo accesible para entender registros existentes. |
| actividad_sqa / metrica_proyecto / archivo_evidencia | `participa(proyecto_id)`. Campos técnicos de reserva no se exponen en DTO normales. |
| entrega / revision_entrega / evidencia | Resolver su actividad y aplicar participación sobre su proyecto. |
| medicion / revision_medicion | Resolver métrica de proyecto y aplicar participación sobre su proyecto. |

No se crean vistas privilegiadas. El resumen se devuelve desde consulta/RPC que autoriza un proyecto y obtiene todos sus datos bajo una misma captura MVCC.

### Excepción controlada para binarios

**Excepción aprobada por ADR-002 al cliente ordinario:** un adaptador exclusivamente de servidor y el procedimiento administrativo de limpieza disponen de credencial privilegiada. Motivo: impedir subidas directas que esquiven validación de bytes y coordinar operaciones Storage/BD. La clave `SUPABASE_SERVICE_ROLE_KEY` no usa prefijo público, no se serializa y no se importa desde UI. No se utiliza para listados, mediciones, revisiones o reportes.

`storage.objects` del bucket privado `evidencias`: SELECT de usuario solo si el archivo está Disponible, tiene una evidencia referenciada y el usuario participa en el proyecto. Sin INSERT/UPDATE/DELETE de clientes autenticados. Las escrituras físicas las hace el adaptador después de autorización expresa. El bucket añade defensa por MIME/tamaño, sin sustituir la validación del servidor.

RPC técnicas `reservar_archivo`, `confirmar_archivo`, `marcar_limpieza`, `confirmar_eliminacion`: EXECUTE solo para el rol de servicio, revocado para `authenticated`, `anon` y PUBLIC. Reserva y confirmación reciben `actor_verificado_id` derivado de Auth por el servidor y repiten sus comprobaciones de rol/participación/responsable/proyecto abierto en BD. Nunca exponer endpoints que acepten ese actor del navegador. La limpieza no suplanta un QA y solo opera sobre objetos elegibles sin referencias.

La credencial privilegiada elude RLS: esta excepción se protege por autorización explícita, funciones acotadas y aislamiento del módulo, y debe revisarse/probarse como tal. No se presenta como una operación protegida automáticamente por RLS.

## Máquina de estados

| Estado origen | Operación | Actor | Condición | Estado destino |
|---|---|---|---|---|
| No existe | Crear instancia | QA autorizado | Tipo de catálogo activo; proyecto abierto. | Pendiente |
| Pendiente | Asignar | QA autorizado | Responsable con rol Miembro y participación en el mismo proyecto. | Pendiente |
| Pendiente | Iniciar | Miembro asignado | Identidad y asignación coincidentes. | En progreso |
| En progreso | Preparar resultado/evidencia | Miembro asignado | Intento en preparación. | En progreso |
| En progreso | Enviar | Miembro asignado | Resultado y al menos una evidencia válida; envío atómico. | En revisión |
| En revisión | Aprobar | QA autorizado | Entrega vigente enviada, resultado y evidencia presentes; revisión registrada. | Aprobada |
| En revisión | Devolver | QA autorizado | Observaciones no vacías; revisión registrada. | En progreso |

No hay transición ordinaria desde Aprobada. El Miembro no modifica En revisión. Cada envío congela el intento; la devolución habilita otro. Todas las mutaciones se rechazan si el proyecto está cerrado, incluidos resultados, evidencias, asignaciones, umbrales y correcciones. No hay reapertura aprobada.

## Transacciones y concurrencia

| Operación | Unidad atómica y control |
|---|---|
| Alta de proyecto | Proyecto, participación QA y miembros, actividades elegidas Pendientes, métricas y objetivos. Ante cualquier selección inválida se revierte todo. |
| Agregar métrica | Configuración válida más unicidad de tipo por proyecto; la restricción decide incluso con solicitudes simultáneas. |
| Asignar/iniciar | Comprobar proyecto abierto, responsable y estado con la actualización; no solo antes en Next.js. |
| Enviar entrega | Bloquear actividad/intento, verificar propiedad y evidencia, fijar envío y cambiar estado. No borrar evidencias enlazadas durante esta validación. |
| Aprobar/devolver | Verificar estado/entrega vigente, insertar revisión y cambiar estado en el mismo commit. La unicidad impide dos revisiones del intento. |
| Registrar medición | Crear identidad y revisión 1 juntas, con fuente y valor coherentes. |
| Corregir medición | Bloquear medición, validar revisión esperada y agregar N+1. Una corrección concurrente obsoleta se rechaza como conflicto. |
| Cerrar proyecto | Registrar QA y fecha una sola vez; serializar con escrituras del mismo proyecto. |


Mutaciones hijas toman `FOR SHARE` sobre proyecto y comprueban cierre dentro de la transacción; edición/cierre toman `FOR UPDATE` sobre proyecto. Orden uniforme: proyecto → actividad o métrica → entrega o medición → archivos en orden de ID. Las revisiones de medición bloquean su medición `FOR UPDATE`; decisiones QA bloquean actividad/entrega. La limpieza bloquea solo archivos, nunca recorre después hacia proyecto/actividad, para evitar invertir el orden.

El aislamiento READ COMMITTED más bloqueos explícitos y constraints cubre escrituras aprobadas; no se requiere SERIALIZABLE global. El resumen se obtiene en una única sentencia con CTE/joins y últimas revisiones, por lo que no mezcla varias lecturas de momentos diferentes. No se bloquean escrituras durante la lectura de reportes.

Alto nivel de idempotencia y concurrencia se concreta en [contratos](../arquitectura/contratos-v1.md). Las funciones son la frontera atómica; no se simula una transacción con varias llamadas Supabase JS consecutivas.

## PDF: validación, reserva y limpieza

1. Route Handler Node.js recibe un único PDF como cuerpo binario, con ID de entrega en ruta, nombre codificado en cabecera y versión esperada. Verifica sesión y origen; máximo real 3 MiB, contando bytes, sin confiar en Content-Length.
2. Comprueba sufijo `.pdf`, MIME declarado `application/pdf`, cabecera `%PDF-` y marcador final `%%EOF` seguido solo de espacios/saltos de línea. Calcula SHA-256. Esto detecta incompatibilidades básicas; no certifica ausencia de contenido activo ni equivalencia a un análisis antimalware. Descarga como adjunto, sin incrustación automática de PDF en QAlly.
3. `reservar_archivo` comprueba permisos/estado/versión y crea reserva con metadata ya validada. El ID determina la ruta; upsert deshabilitado. La operación de transferencia tiene plazo máximo de 60 segundos, menor que la reserva de 30 minutos.
4. El adaptador sube el binario; `confirmar_archivo` bloquea proyecto, actividad, entrega y archivo, comprueba reserva vigente y versión esperada, marca Disponible e inserta evidencia en un commit. Solo entonces informa éxito. Un proyecto cerrado durante la transferencia impide la confirmación.
5. Si falla, intenta compensación del objeto sin referencias mediante el protocolo de limpieza. Un resultado ambiguo primero consulta reserva/referencias: no borra un archivo que quizá quedó confirmado. Reintenta confirmación con el mismo archivo solo si puede demostrar que el resultado coincide; no duplica evidencia.
6. Una ejecución administrativa diaria procesa hasta 100 candidatos por lote, repitiendo lotes hasta terminar. Reservas expiran a los 30 minutos, pero limpieza ordinaria espera además 24 horas sin referencias. No toca transferencias con lease vigente. Se ejecutará mediante script versionado posterior con credenciales de servidor, sin programador/servicio nuevo obligatorio.
7. Bajo bloqueo del archivo, comprobar cero referencias y margen de 24 horas, marcar Eliminando y confirmar. Nuevas referencias quedan prohibidas por estado. Borrar el objeto vía Storage; un objeto ya ausente cuenta como eliminado. Marcar Eliminado y conservar el registro técnico. Si falla, queda Eliminando para reintento diario, incluso si no cumple nuevamente el margen temporal.

Para la compensación inmediata del punto 5, la variante por `archivoCompensacionId` del mismo protocolo solo se admite si el servidor conoce que terminó la transferencia y falló la asociación. Bajo bloqueo vuelve a comprobar cero referencias, invalida la reserva y marca Eliminando antes de borrar; esta compensación no espera las 24 horas de la limpieza ordinaria. Si la transferencia o el commit tienen resultado desconocido, no se aplica la excepción: se consulta el estado y se conserva el archivo para reconciliación segura. En ambos caminos queda prohibido confirmar nuevas referencias después de marcar Eliminando.

El estado reservado no es una entrega confirmada incompleta: es preparación técnica explícita. Ante fallos permanecen intactos el resultado válido previo y el estado de actividad. No mantener una transacción SQL abierta mientras se transmite el PDF.

## Lectura privada y enlaces

Lectura por GET de evidencia con sesión del usuario y RLS de Storage, autorizado en cada solicitud y también en proyecto cerrado. Se sirve como adjunto con nombre saneado, `Cache-Control: private, no-store` y `X-Content-Type-Options: nosniff`; sin incrustación automática ni enlaces públicos permanentes. No se guarda una URL firmada como referencia.

Los enlaces tienen máximo 2048 caracteres, URL absoluta HTTP/HTTPS; no se descargan ni inspeccionan en servidor y se escapan al presentar. La privacidad de su destino depende del proveedor externo, no del bucket de QAlly. No se agrega integración con GitHub.

## Mediciones y evaluaciones

La fuente de cada revisión se valida con la definición de métrica y se recalcula el valor en servidor; no se acepta un valor calculado por el navegador como autoridad. PostgreSQL asegura consistencia de campos, revisión y autor. Las reglas concretas de cálculo, captura, límites y comparación están aprobadas en el [catálogo de métricas](../producto/catalogo-metricas.md).

Revisión 1 original y N−1 anterior permanecen inmutables. La fecha de una corrección no modifica la fecha/orden de la medición. Una tasa sin denominador evaluable se identifica como No evaluable; una medición explícita igual a cero se conserva como cero. Sin filas de medición es Sin medición.

El cumplimiento usa objetivo actual y valor vigente. No se infiere salud a partir de una media, porcentaje o etiqueta sin algoritmo aprobado. Lecturas para resumen/reporte deben corresponder a una captura consistente de la BD, mediante consulta única o transacción de lectura apropiada. La vista de reporte y PDF usan esa misma captura; no recalcular separadamente al exportar sin actualizar también la vista.

## Captura del reporte

Reporte y PDF usan la misma captura consistente del resumen, cifrada con AES-256-GCM y ligada a usuario/proyecto. Expira a los 15 minutos; secreto exclusivo de servidor, sin tabla de histórico ni dependencia de memoria local compartida. La exportación vuelve a autorizar QA y participación, verifica token/expiración y no acepta un resumen modificable enviado por cliente. Detalles del formato, claves, límites de 1 MiB de captura, 2 MiB de petición y 3 MiB de PDF en [contratos v1](../arquitectura/contratos-v1.md). No truncar datos para cumplir límites: error explícito y revisión del diseño si se superan.

## Escenarios de aceptación y estado de ejecución

La parte de datos cuenta con pruebas de integración locales: ver [resultados del bootstrap](plan-bootstrap-supabase.md#resultado-de-ejecución-local--2026-10-18). CU-01 a CU-04 ya tienen validación conjunta de páginas/acciones Next.js, autorización, idempotencia, concurrencia y flujo de archivos en Chrome estable/Firefox: [resultados y límites](../equipo/integracion-cu02-cu03-cu04.md). CU-05/06, paginación de CU-04 y rendimiento desplegado continúan pendientes. Esta tabla conserva los criterios completos; no certifica todos los RNF.

| RNF | Escenarios mínimos |
|---|---|
| 01 | Sesión ausente, inválida o expirada en página, acción, RPC y descarga. |
| 02 | Miembro intenta crear proyecto, editar métricas, cambiar rol, aprobar o devolver mediante solicitudes directas. |
| 03 | Dos proyectos con QA/miembros distintos; manipular ID de actividad, medición, entrega y ruta PDF; QA sin participación también es rechazado. |
| 04 | Vistas de proyectos, métricas, actividades y resumen con datos representativos; ≤ 3 s en 9/10 ejecuciones por vista. |
| 05 | Registros y actualizaciones ≤ 3 s en 9/10 ejecuciones por operación, excluida transferencia PDF. |
| 06 | PDF disponible ≤ 8 s en 9/10 ejecuciones. Comparar contenido con vista y fecha de generación, incluso ante cambios concurrentes. |
| 07 | Flujos críticos CU-01 a CU-06 en Chrome y Firefox estables de escritorio. Registrar versiones. |
| 08 | Recargar y volver a iniciar sesión: recuperar campos, relaciones, estados y evidencias; cerrar proyecto y conservar consulta/PDF. |
| 09 | Fallar alta a mitad; duplicar métrica concurrentemente; aprobar/devolver simultáneamente; cerrar durante escritura; fallar carga/asociación/limpieza; intentar borrar objeto mientras se envía. Sin filas de negocio parcialmente confirmadas. |
| 10 | Corregir medición vigente y antigua varias veces, incluido caso No evaluable; conservar original, anterior, nuevo, autor, fecha y otras mediciones; resolver correcciones concurrentes. |

Rendimiento requiere entorno desplegado, dataset representativo, diez ejecuciones por operación/vista y registro de equipo, navegador y conexión. El presente diseño permite preparar las pruebas, pero no demuestra cumplimiento sin implementación y mediciones.

Casos adicionales de ADR-002: alta reintentada con misma clave y contenido idéntico/diferente; llamada directa a RPC técnicas y subida a Storage como authenticated rechazadas; limpieza de PDF compartido entre intentos; token de reporte alterado, expirado o de otro usuario rechazado; vista/PDF invariables ante cambios concurrentes. Dataset representativo especificado en el [detalle técnico](detalle-tecnico-v1.md). Las pruebas de BD y de CU-01 a CU-04 cubren parte de estos criterios; no sustituyen la validación pendiente de los demás flujos de aplicación y del rendimiento desplegado.

Referencias oficiales: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones](https://supabase.com/docs/guides/database/functions), [Storage](https://supabase.com/docs/guides/storage/security/access-control) y [bloqueos PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).
