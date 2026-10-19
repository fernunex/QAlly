# Diccionario de datos de QAlly

**Estado: diseño APROBADO, 2026-10-18.** Especificación documental, sin DDL ejecutable. Tipos, longitudes y precisión aprobados por [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md); implementación SQL pendiente. [Detalle técnico](detalle-tecnico-v1.md) y [contratos](../arquitectura/contratos-v1.md) precisan constraints y operaciones. Véanse [modelo ER](modelo-entidad-relacion.md) y [seguridad e integridad](seguridad-integridad.md).

## Convenciones

- «Sí» en Nulo permite ausencia; «No» equivale a obligatorio. PK/FK identifican llaves. Todas las FK de usuario apuntan a `perfil.usuario_id`, salvo la identidad inicial a `auth.users.id`.
- UUID identifica entidades sin significado de negocio. Los códigos de catálogo son únicos; no dependen del nombre mostrado.
- `timestamptz` conserva instantes; la presentación usa la zona del usuario. Las fechas de planificación son `date`.
- El servidor determina autor, creación, revisión, envío y cierre; el cliente no puede suplantarlos. Los valores y objetivos usan `numeric(20,8)`, no punto flotante; límites y comparación exacta en el catálogo de métricas.
- Los textos obligatorios se validan sin espacios vacíos. Los límites aprobados abajo y en el detalle técnico deben replicarse en validación de entrada y BD; no truncar silenciosamente.
- Se restringe borrado de referencias históricas. No se almacenan contraseñas, claves privilegiadas ni URL temporales firmadas.

## `perfil`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| usuario_id | uuid | No | PK y FK a `auth.users.id`; una identidad por perfil. |
| nombre | varchar(120) | No | Nombre visible; no único. |
| rol | text | No | Exclusivamente `QA` o `Miembro del equipo`; global y protegido. |

Provisionado con cuentas iniciales; sin edición de rol ni módulo de cuentas por usuarios. El correo y las credenciales permanecen en Auth.

## `proyecto`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| nombre | varchar(200) | No | Nombre identificable, no único. |
| descripcion | varchar(5000) | No | Objetivo y alcance breve. |
| periodo_academico | varchar(40) | Sí | Etiqueta informativa libre de hasta 40 caracteres; varios proyectos por periodo permitidos, vacío a nulo. |
| fecha_inicio | date | No | Inicio previsto o real. |
| fecha_fin_prevista | date | Sí | Mayor o igual que `fecha_inicio`. |
| creado_por | uuid | No | FK perfil; QA creador. |
| creado_en | timestamptz | No | Asignado al crear. |
| actualizado_en | timestamptz | No | Actualización de información general/cierre. |
| cerrado_por | uuid | Sí | FK perfil; QA autorizado. |
| cerrado_en | timestamptz | Sí | Ambos campos de cierre presentes o ambos nulos. |
| version | bigint | No | Inicial 1; edición/cierre exigen versión esperada y la incrementan. |
| solicitud_creacion_id | uuid | No | Única con `creado_por`; identifica reintentos del alta. |
| solicitud_creacion_hash | char(64) | No | SHA-256 hexadecimal del payload normalizado calculado en BD. |

No hay reapertura en esta versión. Un proyecto cerrado conserva consultas y generación de reportes permitidas.

## `participacion_proyecto`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| proyecto_id | uuid | No | PK compuesta y FK proyecto. |
| usuario_id | uuid | No | PK compuesta y FK perfil. |
| asociada_en | timestamptz | No | Fecha de autorización. |

El alta incluye al QA creador y a los miembros seleccionados. No se añade un módulo de administración posterior de accesos. Una eventual revocación requiere preservar autores e historial y decidir el tratamiento de actividades asignadas antes de implementarla.

## `etapa`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| codigo | varchar(16) | No | PK estable. |
| nombre | varchar(80) | No | Nombre único de etapa. |
| orden | smallint | No | Único; orden 1, 2 y 3. |

Semillas definitivas: `requerimientos` → Especificación de requerimientos; `diseno` → Diseño del software; `desarrollo` → Desarrollo. Solo esas tres filas; no edición funcional.

## `tipo_actividad`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| codigo | varchar(16) | No | Único y estable. |
| nombre | varchar(200) | No | Nombre visible. |
| descripcion | varchar(5000) | No | Alcance y resultado del catálogo v1; fuente de descripción inicial de instancia. |
| etapa_codigo | varchar(16) | No | FK etapa. |
| activa | boolean | No | Habilita nuevas selecciones; no elimina instancias previas. |
| preseleccionada | boolean | No | Valor inicial modificable en selección de CU-01; Sí para A-01, A-03, A-05, A-06 y A-09; No para las demás. |

Resultado, PDF/enlace admisible y criterios QA están en el [catálogo aprobado](../producto/catalogo-actividades.md); la revisión es decisión QA, no aprobación automática.

## `tipo_metrica`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| codigo | varchar(16) | No | Único y estable. |
| nombre | varchar(200) | No | Nombre visible. |
| etapa_codigo | varchar(16) | No | FK etapa; M-01..M-04 pertenecen a Desarrollo. |
| unidad | varchar(20) | No | `%` para M-01/02/03; `defectos` para M-04. |
| definicion_clave | varchar(64) | No | Identifica captura, validación y cálculo implementados, sin código ejecutable en la columna. |
| activa | boolean | No | Solo tipos activos disponibles en nuevas selecciones. |

Definiciones fijas `m01_pruebas_v1`, `m02_pr_v1`, `m03_requisitos_v1`, `m04_defectos_v1`; fórmulas y capturas en el [catálogo](../producto/catalogo-metricas.md).

## `actividad_sqa`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| proyecto_id | uuid | No | FK proyecto. |
| tipo_actividad_id | uuid | No | FK tipo_actividad; admite repetición por proyecto. |
| descripcion | varchar(5000) | No | CU-01 copia descripción del tipo; CU-03 requiere descripción específica no vacía. |
| responsable_id | uuid | Sí | Con `proyecto_id`, FK a participación; además rol Miembro. |
| estado | text | No | `Pendiente`, `En progreso`, `En revisión`, `Aprobada`; inicial Pendiente. |
| creado_por | uuid | No | FK perfil; QA autorizado. |
| creado_en | timestamptz | No | Fecha de creación. |
| version | bigint | No | Contador positivo para control de concurrencia. |

No se duplica etapa, resultado ni aprobación: se obtienen del tipo, entrega y revisión correspondientes. Las escrituras de estado, responsable, borrador o evidencias incrementan esta versión; las reservas técnicas no la cambian.

## `entrega`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK e identidad estable del intento. |
| actividad_id | uuid | No | FK actividad_sqa. |
| numero_intento | integer | No | Positivo; único por actividad. |
| resultado | varchar(20000) | Sí | Preparación parcial permitida; obligatorio no vacío al enviar. |
| autor_id | uuid | No | FK perfil; responsable asignado. |
| creada_en | timestamptz | No | Fecha de preparación. |
| enviada_en | timestamptz | Sí | Nulo = preparación; presente = contenido inmutable. |

Una única entrega sin enviar por actividad mediante índice único parcial. Solo se prepara estando En progreso. Tras devolución se crea otro intento; las observaciones anteriores permanecen consultables.

## `evidencia`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| entrega_id | uuid | No | FK entrega. |
| tipo | text | No | PDF o Enlace. |
| archivo_id | uuid | Sí | FK archivo_evidencia; obligatorio solo para PDF y del mismo proyecto. |
| url | varchar(2048) | Sí | Obligatoria solo para Enlace HTTP/HTTPS absoluto. |
| autor_id | uuid | No | FK perfil; responsable validado. |
| creada_en | timestamptz | No | Momento de asociación validada. |

PDF exige archivo Disponible y URL nula; Enlace exige URL y archivo nulo. La metadata física pertenece a archivo_evidencia. Una referencia solo se modifica en borrador; varios intentos pueden referenciar el mismo archivo inmutable. Sin FK de producto sobre tablas internas de Storage.

## `archivo_evidencia`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK generado en servidor; nunca reutilizado. |
| proyecto_id | uuid | No | FK proyecto; inmutable. |
| entrega_origen_id | uuid | No | FK entrega donde se autorizó la carga; mismo proyecto. |
| creado_por | uuid | No | FK perfil, responsable validado al reservar. |
| ruta_objeto | varchar(255) | No | Única; `proyecto_id/archivo_id.pdf` dentro del bucket privado `evidencias`. |
| nombre_archivo | varchar(255) | No | Nombre informativo saneado, sin rutas ni controles. |
| mime_type | varchar(40) | No | `application/pdf`. |
| tamano_bytes | bigint | No | 1..3 145 728. |
| sha256 | char(64) | No | Digest del binario validado; no se deduplica entre proyectos. |
| estado | text | No | Reservado, Disponible, Eliminando o Eliminado. |
| creado_en | timestamptz | No | Fecha de reserva. |
| actualizado_en | timestamptz | No | Última transición/control de referencias. |
| reserva_hasta | timestamptz | No | Creación + 30 minutos; una reserva expirada no se finaliza. |
| sin_referencias_desde | timestamptz | Sí | Fecha desde la cual no tiene referencias; nula si tiene alguna. Mantenida en BD, no por cliente. |

Una referencia solo apunta a archivo Disponible y del mismo proyecto. El registro técnico conserva metadata y estados; no es una entrega confirmada ni un binario en PostgreSQL. Confirmar y limpiar requieren bloqueo del archivo; ver [seguridad e integridad](seguridad-integridad.md).

## `revision_entrega`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| entrega_id | uuid | No | FK entrega y única: máximo una revisión por intento. |
| decision | text | No | `Aprobar` o `Devolver`. |
| observaciones | varchar(10000) | Sí | No vacías obligatorias al devolver; opcionales al aprobar. |
| qa_id | uuid | No | FK perfil; QA autorizado del proyecto. |
| revisada_en | timestamptz | No | Autor y fecha constituyen el registro de aprobación/devolución. |

Solo se inserta para la entrega enviada vigente y actividad En revisión; no se modifica después.

## `metrica_proyecto`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| proyecto_id | uuid | No | FK proyecto. |
| tipo_metrica_id | uuid | No | FK tipo_metrica; único junto con proyecto_id. |
| operador | text | No | Fijo por tipo: >= para M-01/02/03; <= para M-04, no editable. |
| objetivo | numeric(20,8) | No | M-01/02/03: porcentaje [0,100], hasta cuatro decimales; M-04: entero [0,2 000 000 000]. |
| objetivo_critico | numeric(20,8) | Sí | Obligatorio para M-01, porcentaje [0,100], hasta cuatro decimales; nulo para las demás. |
| configurada_por | uuid | No | FK perfil; QA que realizó la configuración vigente. |
| configurada_en | timestamptz | No | Fecha/token de configuración vigente, estrictamente posterior al anterior al actualizar; la RPC exige `configuradaEnEsperada`. |

Objetivos iniciales: M-01 general 90 y crítico 100; M-02/03 100; M-04 0. QA puede modificarlos respetando el dominio, sin intervalos ni operadores libres. La configuración actual evalúa el valor actual; no se compromete un historial de umbrales que los CU no exigen.

## `medicion`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| id | uuid | No | PK. |
| metrica_proyecto_id | uuid | No | FK metrica_proyecto. |
| medida_en | timestamptz | No | Fecha del dato medido; participa en el orden de vigencia. |
| orden_registro | bigint | No | Único, generado por BD; desempate estable, no debe ser consecutivo sin huecos. |
| creada_por | uuid | No | FK perfil; QA autorizado. |
| creada_en | timestamptz | No | Fecha de captura inicial. |

La identidad temporal no se modifica mediante corrección de valores. Se inserta junto con revisión 1; nunca una medición sin revisión confirmada.

## `revision_medicion`

| Campo | Tipo | Nulo | Clave / regla |
|---|---|:---:|---|
| medicion_id | uuid | No | PK compuesta y FK medicion. |
| numero_revision | integer | No | PK compuesta; inicia en 1 y aumenta en uno por corrección. |
| datos_fuente | jsonb | No | Objeto completo estricto según catálogo, conteos enteros [0,1 000 000 000] y `fuente_referencia` no vacía de hasta 2048 caracteres. |
| valor | numeric(20,8) | Sí | Obligatorio si evaluable; nulo si no evaluable. Cero evaluable es válido. |
| condicion | text | No | `Evaluable` o `No evaluable`. |
| causa_no_evaluable | varchar(200) | Sí | Obligatoria si No evaluable; nula si Evaluable. |
| autor_id | uuid | No | FK perfil; QA autorizado al registrar/corregir. |
| registrada_en | timestamptz | No | Fecha de revisión, no utilizada para elegir la medición más reciente. |

La condición corresponde al valor principal. En M-01, un valor general válido puede coexistir con cumplimiento conjunto No evaluable si no hay muestra crítica; se explica en el catálogo.

Las revisiones son inmutables. El valor previo es el de la revisión N−1; el original nunca se pierde. No hay actualización directa ni borrado ordinario de mediciones o revisiones.

## Campos derivados y pendientes

Se derivan: proyecto abierto/cerrado, etapa de instancias, estado de preparación de entrega, última medición, última revisión, cumplimiento y resúmenes por etapa. No se persisten puntajes de salud ni versiones históricas del reporte.

Diseño v1 cerrado por ADR-002: capturas/etapas de métricas, criterios QA, límite PDF, longitudes y precisión definidos. PENDIENTE de producto: algoritmo y clasificación de salud. DDL, funciones/políticas ejecutables y pruebas pertenecen a implementación posterior; no autorizan cambiar los acuerdos.
