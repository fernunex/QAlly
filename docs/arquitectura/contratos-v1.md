# Contratos internos v1

**Estado: APROBADO, 2026-10-18**, por [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). Especificación documental sin código ni SQL ejecutable. Usa el [detalle de datos](../datos/detalle-tecnico-v1.md). Salud permanece Sin evaluar.

**Implementación posterior:** CU-01 a CU-04 están conectados a la sesión real y las RPC/RLS existentes. Guías: [CU-01](../modulos/cu01-implementacion.md), [CU-02](../modulos/cu02-implementacion.md), [CU-03](../modulos/cu03-implementacion.md), [CU-04](../modulos/cu04-implementacion.md). [Integración conjunta y límites de cobertura](../equipo/integracion-cu02-cu03-cu04.md). CU-05 ([registro](../modulos/cu05-implementacion.md)) y CU-06 ([registro](../modulos/cu06-implementacion.md)) están implementados en ramas pendientes de integración; los contratos aprobados permanecen vigentes (CU-06 añade `emitidaEn` al resultado de `generarReporte`, pendiente de visto bueno).

## 1. Convenciones del contrato

Las funciones internas reciben `(contextoServidor, entrada)`. El contexto se crea desde identidad Auth verificada; no se serializa ni se acepta como argumento procedente del navegador. Las RPC ordinarias vuelven a autorizar con `auth.uid()`; `contextoServidor` no es un parámetro SQL para suplantar identidad.

Tipos de transporte:

| Nombre | Forma exacta |
|---|---|
| UUID | Cadena UUID canónica; la entrada se valida. |
| Fecha | Cadena `AAAA-MM-DD` válida. |
| Instante | Cadena ISO 8601 con zona; se normaliza a UTC sin perder precisión de PostgreSQL en comparaciones. |
| Decimal | Cadena decimal sin exponente; hasta cuatro decimales para objetivos y ocho para valores calculados. |
| Version | Cadena de entero positivo de bigint. No convertir a Number. |
| PaginaEntrada | `limite`: entero 1..100, predeterminado 25; `cursor`: cadena opcional, máximo 1024 caracteres. |
| PaginaSalida | `items`: lista de DTO; `siguienteCursor`: cadena o nulo. Orden fijo, no SQL/ordenación libre del cliente. |
| Resultado satisfactorio | `ok: true`, `datos: DTO`. |
| Resultado de error | `ok: false`, `error: {codigo, mensaje, campos?}`; campos es mapa campo→mensaje público, sin SQL, secretos ni rutas internas. |

Todos los objetos de entrada son estrictos: no admiten propiedades desconocidas. Listas de IDs rechazan duplicados salvo instancias de actividad creadas mediante operaciones distintas. Un UUID identifica un recurso, no una prueba de acceso. Consultar un ID inexistente o de otro proyecto devuelve el mismo error NO_DISPONIBLE.

| Código | HTTP cuando aplica | Significado |
|---|:---:|---|
| SIN_SESION | 401 | Identidad ausente/expirada/inválida. |
| PROHIBIDO | 403 | Operación de rol no permitida sin revelar recursos ajenos. |
| NO_DISPONIBLE | 404 | Recurso inexistente o sin acceso. |
| DATOS_INVALIDOS | 422 | Validación de campos, catálogo, relaciones o contenido de archivo. |
| CONFLICTO | 409 | Versión obsoleta, transición ya realizada, tipo duplicado, intento/corrección concurrentes o solicitud reutilizada con otro contenido. |
| PROYECTO_CERRADO | 409 | Solo después de comprobar que el usuario puede conocer el proyecto. |
| TAMANO_EXCEDIDO | 413 | Límite de cuerpo, PDF o captura superado; no se omiten datos silenciosamente. |
| CAPTURA_EXPIRADA | 410 | Reporte temporal expirado; regenerar vista y PDF desde nueva captura. |
| FALLO_PERSISTENCIA | 500 | Fallo técnico; no confirmar éxito. Se registra identificador de diagnóstico sin contenido privado. |

Las Server Actions usan el mismo sobre de resultado aunque no asignen estos estados HTTP. Los Route Handlers respetan los estados y las respuestas privadas no se cachean en compartido.

## 2. DTO de lectura

| DTO | Campos |
|---|---|
| Proyecto | id, nombre, descripcion, periodoAcademico nullable, fechaInicio, fechaFinPrevista nullable, creadoEn, actualizadoEn, cerradoEn nullable, version. Detalle autorizado incluye participantes `{usuarioId,nombre,rol}`. |
| Actividad | id, proyectoId, tipo `{id,codigo,nombre,etapaCodigo}`, descripcion, responsable `{usuarioId,nombre}` nullable, estado, version. Detalle incluye entrega vigente e intentos/revisiones paginados; no expone rutas privadas ni credenciales. |
| Entrega | id, actividadId, numeroIntento, resultado nullable, autorId, creadaEn, enviadaEn nullable, evidencias `{id,tipo,nombreArchivo?,tamanoBytes?,url?}` y revisión `{decision,observaciones,qaId,revisadaEn}` nullable. |
| Metrica | id, proyectoId, tipo `{id,codigo,nombre,etapaCodigo,unidad}`, operador fijo, objetivo, objetivoCritico nullable, valorActual Decimal nullable, condicionPrincipal `Sin medición/Evaluable/No evaluable`, causa nullable y cumplimiento `Cumple/Incumple/No evaluable`. |
| Medicion | id, metricaProyectoId, medidaEn, ordenRegistro, revisionActual y revisión `{numero,datosFuente,valor,condicion,causaNoEvaluable,autorId,registradaEn}`. El historial conserva las revisiones originales. |

El detalle de actividad permite recuperar observaciones de la última devolución aunque todavía no exista un nuevo borrador. La lista de entregas se ordena por intento descendente. El historial de mediciones usa `medida_en DESC, orden_registro DESC`; una corrección no cambia ese cursor. Listas generales usan `creado_en DESC, id DESC`, con cursor validado que no altera el filtro de proyecto autorizado.

## 3. Proyectos y catálogos

| Función interna → RPC | Entrada | Salida / autorización |
|---|---|---|
| listarProyectos → consulta SELECT RLS | PaginaEntrada | Pagina de Proyecto; solo participaciones propias, abiertos y cerrados. |
| consultarProyecto → SELECT RLS y lecturas protegidas | proyectoId | Proyecto con participantes; acceso explícito. |
| listarCatalogos → SELECT RLS | incluirInactivos boolean predeterminado false | Etapas, tipos y valores iniciales aprobados; tipos inactivos no son seleccionables. Requiere perfil. |
| buscarMiembrosElegibles → buscar_miembros_elegibles | texto de 0..120 caracteres, PaginaEntrada | ID/nombre/rol de perfiles Miembro; solo QA autenticado. Sin correo ni otros proyectos. |
| crearProyecto → crear_proyecto | solicitudId, nombre, descripcion, periodoAcademico nullable, fechaInicio, fechaFinPrevista nullable, miembrosIds, actividadesTiposIds, metricas `[{tipoId,objetivo,objetivoCritico?}]` | Proyecto creado y sus IDs de configuración. Requiere QA, no participación previa. Se incorpora creador y se crean solo selecciones elegidas, sin asignar responsables. |
| editarProyecto → editar_proyecto | proyectoId, versionEsperada y los cinco campos generales completos | Proyecto actualizado y nueva versión. QA participante, proyecto abierto. |
| cerrarProyecto → cerrar_proyecto | proyectoId, versionEsperada | Proyecto con autor/fecha de cierre y nueva versión. QA participante; confirmación previa de UI. |

El alta es una transacción. La misma solicitudId con mismo contenido devuelve el alta ya confirmada; distinto contenido produce CONFLICTO. Si la respuesta se pierde se reenvía la misma solicitudId. Un formulario nuevo genera otra. MiembrosIds solo contiene perfiles Miembro existentes; QA creador se agrega en servidor. Selección inicial de cada tipo es única; agregar una nueva instancia del mismo tipo después está permitido.

Las funciones de edición/cierre comprueban versión bajo bloqueo. No se necesita inventar campos obligatorios adicionales ni unicidad de periodo.

## 4. Métricas y mediciones

> **Ampliado por [ADR-003](../decisiones/ADR-003-salud-y-reporte.md), 2026-11-02:** `fuenteReferencia` es opcional (DEC-26); objetivos porcentuales en (0,100] (DEC-29); M-01 cumple con su valor general y expone `cumplimientoCritico` aparte; toda métrica expone `aporte` a la salud.

| Función interna → RPC | Entrada | Salida / autorización |
|---|---|---|
| listarMetricas / consultarMetrica → lecturas protegidas | proyectoId o metricaProyectoId | DTO Metrica; participantes autorizados, incluido cerrado. |
| agregarMetrica → agregar_metrica | proyectoId, tipoId, objetivo, objetivoCritico nullable | Metrica Sin medición. QA, abierto y tipo no duplicado. |
| configurarObjetivo → configurar_objetivo | metricaProyectoId, configuradaEnEsperada, objetivo, objetivoCritico nullable | Metrica reevaluada; QA, abierto. Instante esperado compara la configuración completa anterior sin truncar precisión. |
| registrarMedicion → registrar_medicion | medicionId UUID estable del formulario, metricaProyectoId, medidaEn, datosFuente | Medicion con revisión 1 y Metrica actualizada; QA, abierto. |
| corregirMedicion → corregir_medicion | medicionId, revisionEsperada integer, datosFuente completo | Nueva revisión y Metrica actualizada. No acepta cambiar medidaEn ni orden. QA, abierto. |
| listarMediciones → lectura protegida | metricaProyectoId, PaginaEntrada | Pagina de Medicion con última revisión de cada una. |
| listarRevisionesMedicion → lectura protegida | medicionId, PaginaEntrada | Revisiones por número descendente, con autor y fecha. |

El servidor no acepta `valor` ni `cumplimiento` como entrada. DatosFuente tiene exclusivamente claves del catálogo y fuenteReferencia (representada en persistencia como `fuente_referencia`). La función calcula/valida y devuelve Decimal. M-01 devuelve además `{valorCritico,condicionCritica,causaCritica,objetivoCritico}` para explicar el cumplimiento conjunto.

Reintentar el mismo medicionId, misma métrica, autor y datos/fecha originales devuelve la identidad existente; si no coinciden, CONFLICTO. La comparación usa revisión 1, aunque posteriormente haya correcciones. La función devuelve la última revisión actual e indica `reutilizada: true`; nunca sobrescribe ni oculta correcciones posteriores. Dos correcciones con la misma revisionEsperada no se confirman ambas: una gana y la otra recibe CONFLICTO y debe recargar.

Actualizar objetivo usa una comparación atómica sobre `configurada_en` anterior. La BD debe generar un valor estrictamente posterior al anterior al actualizar (reloj actual o anterior + un microsegundo), para que ni dos cambios en el mismo instante puedan compartir token de concurrencia.

**Implementación posterior (CU-02, 2026-10-19):** las funciones de esta sección se conectan a la aplicación sin cambiar el contrato. listarRevisionesMedicion se expone como `listarCorrecciones`: revisiones ≥ 2 con valor anterior y la captura original. La fecha de medición se captura como día y se envía como `medidaEn` a las 00:00 UTC. [Implementación](../modulos/cu02-implementacion.md).

## 5. Actividades, entregas y evidencias

Toda escritura de actividad exige `versionEsperada`; aumenta `actividad.version` cuando cambia estado, responsable, borrador o referencias de evidencia. Una reserva técnica de archivo no cambia esa versión; confirmar su asociación sí la cambia. El miembro recibe la versión nueva después de cada guardado.

| Función interna → RPC | Entrada adicional a ID/versión cuando aplica | Salida / autorización |
|---|---|---|
| listarActividades → lectura protegida | proyectoId, PaginaEntrada, estado opcional, soloMias boolean, etapa opcional, responsable opcional (UUID de Miembro o `sin`) | Pagina de Actividad con total del filtro; soloMias usa identidad verificada. Filtros aplicados en servidor bajo RLS. |
| consultarActividad → lectura protegida | actividadId | Actividad y detalle permitido; participantes del proyecto. |
| agregarActividad → agregar_actividad | proyectoId, tipoId, descripcion | Actividad Pendiente sin responsable; QA abierto. Ante respuesta ambigua recargar lista; no reintentar automáticamente un alta nueva sin identidad. |
| asignarResponsable → asignar_responsable | actividadId, responsableId, versionEsperada | Actividad Pendiente con responsable Miembro del mismo proyecto. QA abierto. |
| iniciarActividad → iniciar_actividad | actividadId, versionEsperada | Actividad En progreso; solo responsable. |
| prepararEntrega → preparar_entrega | actividadId, versionEsperada | Entrega borrador y versión de actividad. Si existe borrador propio se devuelve sin duplicarlo; si viene de devolución, copia resultado y referencias previas como preparación. |
| guardarResultado → guardar_resultado | entregaId, resultado nullable, versionEsperada | Entrega borrador y nueva versión; responsable En progreso, abierto. Texto vacío se normaliza a nulo. |
| agregarEnlace → agregar_enlace | entregaId, url, versionEsperada | Evidencia y nueva versión; responsable en preparación. Validar HTTP/HTTPS y no descargar destino. |
| quitarEvidencia → quitar_evidencia | evidenciaId, versionEsperada | Entrega y nueva versión; solo borrador propio. Retira referencia, sin borrar físicamente un archivo usado por otro intento. |
| enviarEntrega → enviar_entrega | entregaId, versionEsperada | Actividad En revisión y entrega congelada; responsable, resultado y evidencia válidos en commit. |
| aprobarEntrega → revisar_entrega | entregaId, decision fija Aprobar, observaciones opcionales, versionEsperada | Revisión y Actividad Aprobada; QA autorizado abierto. |
| devolverEntrega → revisar_entrega | entregaId, decision fija Devolver, observaciones obligatorias, versionEsperada | Revisión y Actividad En progreso; QA autorizado abierto. |

**Ampliación APROBADA, 2026-10-19:** el usuario aprobó añadir a listarActividades los filtros opcionales `etapa` y `responsable` (incluido `sin` responsable) para el tablero de CU-03, que pagina por estado con el dataset de 1000 actividades. Es aditiva, sin migración ni cambio de RLS; filtros desconocidos se rechazan. [Implementación CU-03](../modulos/cu03-implementacion.md).

Las transiciones repetidas con versión obsoleta devuelven CONFLICTO y obligan a recargar, sin duplicar envíos o revisiones. Quitar y agregar evidencia son operaciones distintas de preparación; si se necesita conservar una evidencia anterior hasta confirmar reemplazo, se agrega primero la nueva y se quita la anterior después. No se pierde un PDF ya revisado.

### Transferencia de PDF

| Interfaz | Contrato |
|---|---|
| POST `/api/entregas/{entregaId}/evidencias/pdf` | Cuerpo binario `application/pdf`, máximo 3 MiB; cabeceras `X-Nombre-Archivo` con nombre codificado y `X-Version-Actividad` con Version. Sesión propia; verificar Origin contra host permitido y rechazar origen ausente en esta ruta web de mutación. Resultado: evidencia y nueva versión. |
| GET `/api/evidencias/{evidenciaId}/archivo` | Sin ruta Storage enviada por cliente. Autorizar evidencia/proyecto, descargar con identidad del usuario; respuesta PDF como adjunto, nombre saneado, `Cache-Control: private, no-store` y `X-Content-Type-Options: nosniff`. |

El POST usa el adaptador privilegiado aislado solo después de verificación de usuario/estado, según [detalle técnico](../datos/detalle-tecnico-v1.md). Reserva y confirmación no son llamadas de navegador. No se envía base64 para archivos ni se suben varios en una sola petición. UI permite adjuntar varios mediante transferencias individuales secuenciales.

RPC técnicas: `reservar_archivo(actorVerificadoId, entregaId, versionEsperada, metadataValidada)` devuelve archivo/reserva; `confirmar_archivo(actorVerificadoId, archivoId, versionEsperada)` devuelve evidencia/versión; `marcar_limpieza(limite<=100, archivoCompensacionId?)` devuelve candidatos ya marcados; `confirmar_eliminacion(archivoId)` confirma ausencia física. Solo backend/administración con rol de servicio. Parámetros de metadata son nombre, bytes, MIME y SHA-256 calculados a partir del cuerpo validado. Sin archivoCompensacionId, aplica el margen ordinario de 24 horas. Con ese ID, admite únicamente compensación de una transferencia conocida como terminada y asociación fallida, invalidando la reserva y comprobando cero referencias bajo bloqueo; no se usa frente a resultados ambiguos. La excepción concreta el camino de compensación inmediata de ADR-002, sin debilitar la protección de archivos referenciados.

## 6. Resumen y reporte sin historial persistente

> **Ampliado por [ADR-003](../decisiones/ADR-003-salud-y-reporte.md), 2026-11-02.** La salud ya no es el literal `{estado: "Sin evaluar", motivo}`: es `EstadoSalud` con porcentaje, clasificación, puntos, conteos y advertencias calculados por `private.salud_json`. Cada actividad agrega `instancia` y `evidencias` del último intento enviado; cada métrica agrega `aporte` y `cumplimientoCritico`. Nueva lectura `consultar_salud(uuid[])` para listado y encabezado. El resto de esta sección sigue vigente.

`consultarResumen(contexto, {proyectoId})` usa `consultar_resumen(proyectoId)`, una lectura autorizada consistente. Devuelve:

- proyecto `{id,nombre,descripcion,periodoAcademico,fechaInicio,fechaFinPrevista,cerradoEn}` y generadoEn;
- tres etapas en orden fijo, cada una con conteos por los cuatro estados y lista resumida de actividades `{id,tipoCodigo,tipoNombre,responsableNombre,estado}`;
- métricas con objetivos, valores principal/crítico, condición, causa, cumplimiento y fecha de la medición vigente;
- salud general y por etapa `{estado: "Sin evaluar", motivo: "Algoritmo pendiente"}`. Sin porcentaje, pesos ni categorías supuestas.

El resumen no incluye texto completo de resultados, todas las revisiones, binarios ni historial de mediciones: CU-06 pide estado actual y resumen de actividades, no exportación de todos los detalles. Estos se consultan por sus interfaces de detalle.

`generarReporte(contexto, {proyectoId})` exige QA participante, también si está cerrado. Obtiene el resumen y devuelve `{resumen, capturaToken, venceEn}`. La pantalla y la exportación usan ese mismo resumen; no se vuelve a consultar la calidad al exportar.

### Captura autocontenida

- Payload: versión de formato 1, usuarioId, proyectoId, emitidaEn, venceEn y resumen completo. Se emite por 15 minutos. Máximo JSON UTF-8 de 1 MiB; si excede, TAMANO_EXCEDIDO, sin truncar actividades/métricas.
- Cifrado autenticado AES-256-GCM mediante `node:crypto`: clave exclusiva de entorno de 32 bytes, nonce aleatorio de 12 bytes y tag de 16 bytes. Formato `v1.iv.ciphertext.tag` con segmentos base64url y datos autenticados del formato. No inventar un cifrado ni reutilizar nonce.
- Secreto `REPORT_SNAPSHOT_KEY_BASE64` exclusivamente de servidor, diferente por entorno. Rotarlo invalida capturas abiertas y obliga a regenerar; no se almacena el secreto en el repo ni en variables públicas.
- El token se mantiene solo durante el flujo de pantalla, sin URL, logs ni localStorage; no existe listado histórico o tabla de reportes. No depende de memoria compartida entre instancias serverless.
- Exportación vuelve a verificar identidad, rol QA, participación, integridad del token, usuario/proyecto y expiración antes de renderizar. Nunca acepta `resumen` libre enviado por el navegador como fuente confiable.

POST `/api/reportes/pdf`: JSON `{capturaToken}`, cuerpo máximo 2 MiB y control de origen como el POST de archivo. Descifra/verifica y genera con `@react-pdf/renderer` en Node.js, sin descargar fuentes, imágenes o enlaces externos. PDF máximo 3 MiB; si excede, error explícito sin recortar contenido. Respuesta privada como adjunto. El PDF usa la fecha emitida de la captura, no una nueva fecha que sugiera datos actualizados.

Una captura expirada/tamperada no se exporta. Regenerar obtiene otra captura y actualiza también la vista. Las cotas son técnicas del prototipo y se verificarán con el dataset; si un proyecto real las supera se revisa el diseño, no se omiten filas. No representan cumplimiento demostrado del RNF-06.

## 7. Verificación necesaria al implementar

- Probar cada RPC directamente como Miembro/QA sin participación, además del camino normal de servidor.
- Probar autoasignación de rol/participación, llamadas directas de reserva/confirmación como authenticated y subida directa a Storage: deben fallar.
- Dos altas con misma solicitud y contenido crean uno; distinto contenido produce conflicto; reintento tras pérdida de respuesta recupera el alta.
- Dos correcciones con revisión esperada igual conservan un único sucesor; corregir una antigua no cambia la medición vigente.
- Versiones obsoletas no sobrescriben borradores; dos decisiones QA no se confirman; cierre concurrente impide mutaciones posteriores.
- Probar PDF ausente, falso, demasiado grande y fallo después de subida; ningún error debe presentar una entrega como confirmada.
- Quitar una referencia y ejecutar limpieza no afecta otro intento; archivo Eliminando no admite nuevas referencias; repetir borrado ausente es seguro.
- Modificar el resumen visible/JSON no modifica el PDF exportado; token alterado, expirado o de otro usuario/proyecto se rechaza. Cambios concurrentes no desalinean la vista y el PDF de la captura original.

**Fuentes técnicas:** [Node.js crypto](https://nodejs.org/api/crypto.html), [límites Vercel](https://vercel.com/docs/functions/limitations), [Server Actions Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions). Los contratos y cotas son decisiones aprobadas de QAlly, sin implementación ni configuración modificada.
