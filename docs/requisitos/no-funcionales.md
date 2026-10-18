## 7. Atributos y requerimientos no funcionales (RNF)

Atributos acordados: Seguridad (RNF-01 a 03), Rendimiento (RNF-04 a 06), Portabilidad (RNF-07) e Integridad de datos (RNF-08 a 10). Los porcentajes de aceptación hacen referencia a los escenarios de prueba definidos; no constituyen garantía absoluta en cualquier situación.

### RNF-01 — Seguridad

**Requisito:** QAlly debe requerir una sesión autenticada para utilizar sus funciones.

**Criterio de aceptación:** 100% de los accesos sin sesión probados deben bloquearse.

**Cómo se comprobará:** Probar rutas protegidas con sesión ausente o expirada; registrar acceso permitido/bloqueado.

### RNF-02 — Seguridad

**Requisito:** Las operaciones restringidas deben validarse según rol en el servidor.

**Criterio de aceptación:** 100% de operaciones no autorizadas probadas deben ser rechazadas.

**Cómo se comprobará:** Con cuenta Miembro intentar crear proyecto, modificar métricas y aprobar actividades; verificar rechazo aun mediante solicitudes directas.

### RNF-03 — Seguridad

**Requisito:** La información y evidencias de un proyecto solo serán visibles para usuarios autorizados a ese proyecto.

**Criterio de aceptación:** 0 accesos indebidos exitosos en escenarios de prueba.

**Cómo se comprobará:** Usar dos proyectos y usuarios con acceso diferente; probar URL/identificador y consulta de evidencias.

### RNF-04 — Rendimiento

**Requisito:** Las vistas principales de proyectos, métricas y actividades deben mostrarse sin demora excesiva.

**Criterio de aceptación:** Tiempo de carga ≤ 3 s en al menos 9 de 10 ejecuciones por vista.

**Cómo se comprobará:** Cronometrar desde acceso/selección hasta contenido visible; usar DevTools, misma configuración y datos de prueba.

### RNF-05 — Rendimiento

**Requisito:** Las operaciones de registro y actualización deben procesarse en tiempo adecuado.

**Criterio de aceptación:** Respuesta ≤ 3 s en al menos 9 de 10 ejecuciones por operación.

**Cómo se comprobará:** Medir desde confirmar guardado hasta ver respuesta de éxito; no incluir la transferencia de PDFs en este tiempo.

### RNF-06 — Rendimiento

**Requisito:** La generación del reporte de calidad en PDF debe completarse en tiempo razonable.

**Criterio de aceptación:** PDF disponible para descarga en ≤ 8 s en al menos 9 de 10 ejecuciones.

**Cómo se comprobará:** Medir desde seleccionar Exportar a PDF hasta que el archivo esté disponible; datos representativos.

### RNF-07 — Portabilidad

**Requisito:** Los flujos críticos de QAlly deben funcionar en versiones estables de Chrome y Firefox para escritorio.

**Criterio de aceptación:** 100% de los flujos críticos probados deben completarse correctamente en ambos navegadores.

**Cómo se comprobará:** Ejecutar casos críticos equivalentes de CU-01 a CU-06 en ambos navegadores; registrar versiones y resultados.

### RNF-08 — Integridad de datos

**Requisito:** Los datos guardados de proyectos, métricas y actividades deben conservarse correctamente.

**Criterio de aceptación:** 100% de las verificaciones deben recuperar los datos guardados sin alteraciones.

**Cómo se comprobará:** Guardar registros, recargar y volver a iniciar sesión; comparar campos, estados, referencias y evidencias.

### RNF-09 — Integridad de datos

**Requisito:** Las operaciones fallidas no deben producir registros incompletos o inconsistentes.

**Criterio de aceptación:** 0 registros parcialmente guardados en escenarios de operación fallida.

**Cómo se comprobará:** Forzar validaciones fallidas y otras interrupciones controladas que sean practicables; revisar datos almacenados.

### RNF-10 — Integridad de datos

**Requisito:** Las mediciones anteriores y las correcciones deben conservar trazabilidad.

**Criterio de aceptación:** 100% de las pruebas deben conservar historial y cambios de medición.

**Cómo se comprobará:** Registrar varias mediciones; corregir una; verificar valor original, valor corregido, usuario, fecha/hora y otras mediciones intactas.

Condiciones comunes para rendimiento: al menos 10 ejecuciones por operación o vista crítica, entorno de pruebas desplegado y datos representativos; registrar equipo, navegador, versión, conexión y resultados. La meta 9/10 equivale a 90% de las ejecuciones de la muestra; no es una garantía estadística sobre todos los usuarios.

**Estado:** diez RNF y cuatro atributos aprobados en la planificación; métricas de prueba definidas, escenarios y dataset aún por concretar.
