# Alcance y reglas del producto

**Estado: requisitos APROBADOS**, actualizados por los acuerdos del responsable del proyecto del 2026-10-30, [DEC-25–28](../decisiones/registro.md#cierre-funcional--2026-10-30). Las decisiones técnicas de ADR-001/002 se conservan; esta actualización no acredita implementación ni pruebas. [Pendientes y brechas](../requisitos/pendientes-y-brechas.md).

## Propósito y contexto
QAlly administra proyectos de software, actividades SQA, evidencias, métricas y reportes de calidad. Se desarrolla como trabajo académico por cinco estudiantes. El stack tecnológico y el monolito modular están aprobados en `../arquitectura/stack-aprobado.md`. Se prevé uso de escritorio. El diseño técnico inicial está documentado en [arquitectura](../arquitectura/diseno-arquitectural.md) y [datos](../datos/modelo-entidad-relacion.md); su estado de implementación se consulta en los módulos y sus registros fechados.

El trabajo distingue **SQA ofrecido por el producto** de **SQA aplicado por el equipo para desarrollar QAlly**. Ver `docs/equipo/sqa-en-el-desarrollo.md`.

## Roles y seguridad
- **QA:** gestiona proyectos, catálogos seleccionados, asignaciones, mediciones, revisiones y reportes.
- **Miembro del equipo:** consulta proyectos autorizados; inicia/entrega actividades asignadas; consulta indicadores/salud.
- No hay rol PM en el producto. La autenticación es precondición; se previeron cuentas semilla para primera iteración.
- Comprobar rol y acceso a proyecto **en el servidor**; proteger también evidencias y accesos directos.
- **APROBADO, 2026-10-18:** rol global por usuario más participación explícita en cada proyecto. QA no accede a proyectos ajenos por su rol; al crear se incorpora como participante. [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md).

## Etapas, catálogos y proyectos
- Etapas fijas: **Especificación de requerimientos**, **Diseño del software**, **Desarrollo**.
- Los tipos de actividades y métricas provienen de **catálogos cerrados**; las etapas están preasignadas desde el catálogo. Los catálogos v1 están **APROBADOS** por [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md), sin presumir ratificación académica independiente.
- QA encuentra las diez actividades A-01…A-10 preseleccionadas y puede desmarcar cualquiera; solo las seleccionadas generan instancias Pendiente. Selecciona métricas/umbrales y agrega instancias posteriormente. Esto sustituye la preselección de cinco de ADR-002.
- Una actividad del catálogo puede tener **múltiples instancias** por proyecto. Un tipo de métrica solo aparece **una vez** por proyecto.
- Campos generales de esta versión: nombre, descripción y fecha de inicio obligatorios; periodo académico y fin previsto opcionales. Fin previsto no precede al inicio. Periodo informativo de hasta 40 caracteres, sin unicidad; varios proyectos por periodo permitidos en esta versión. Metadata de creación, actualización y cierre automática.
- Un proyecto cerrado conserva su información y evidencias consultables y permite reportes según rol. Se bloquean todas las escrituras de negocio; no hay reapertura ordinaria. **APROBADO, 2026-10-18**, ADR-001.

## Estados y evidencia de actividad
```text
Pendiente --(Miembro asignado: iniciar)--> En progreso
En progreso --(Miembro: resultado + PDF/enlace; enviar)--> En revisión
En revisión --(QA: aprobar)--> Aprobada
En revisión --(QA: devolver con observaciones)--> En progreso
```
- La asignación de responsable no cambia automáticamente Pendiente → En progreso.
- El miembro no edita mientras la entrega esté En revisión; Aprobada es final sin edición ordinaria.
- La persona asignada debe pertenecer al proyecto.
- Cada envío conserva resultado y evidencias como intento inmutable. Tras devolución se prepara otro intento sin sobrescribir lo revisado. La revisión conserva QA, fecha y decisión.

## Métricas y reportes
- QA configura umbrales, registra mediciones históricas y puede corregir un dato con rastro mínimo de **valor anterior, valor corregido, autor, fecha/hora**.
- La última medición vigente determina el valor actual; **Sin medición ≠ 0**. Las tasas sin denominador evaluable no se califican arbitrariamente.
- La vigencia se ordena por fecha de medición y desempate estable de registro. Una corrección agrega revisión sin cambiar esa identidad temporal; corregir una medición antigua no la convierte en la actual. Se conserva original, anterior, nuevo, autor y fecha/hora.
- La salud general y por las tres etapas utiliza la [fórmula aprobada](#salud-aprobada); el código anterior que devuelve siempre «Sin evaluar» tiene una brecha de implementación.
- QA genera reportes del **estado actual**, los ve dentro de QAlly y los exporta a PDF. Dashboard y reportes deben mostrar las mismas cifras y utilizar la misma definición y resultados de salud para el mismo estado actual.

## Alcance no comprometido
No dar por acordados: módulos completos de defectos o cuentas, integraciones obligatorias con GitHub, métricas/actividades personalizadas por los usuarios, histórico de PDFs, filtros analíticos avanzados, tercer rol PM, soporte móvil como requisito.

## Detalles aún abiertos
La fórmula y clasificación de salud están aprobadas. Solo quedan las ambigüedades de [requisitos pendientes](../requisitos/pendientes-y-brechas.md#pendientes-de-requisitos): objetivo porcentual cero, nulos técnicos y política histórica ante cambio de objetivos. El [seguimiento](../decisiones/pendientes.md) conserva las notas de implementación históricas.

## Reglas concretas de la versión

- M-01..M-04 pertenecen a Desarrollo y se capturan manualmente según el [catálogo](catalogo-metricas.md). Objetivos iniciales configurables: 90% general en M-01; 100% en M-02/03; 0 en M-04. Comparador fijo por tipo. El 100% de pruebas críticas aprobadas es criterio independiente de pruebas; no condiciona el cumplimiento general ni el aporte M-01 a salud (DEC-26).
- Cada medición incluye fecha y datos suficientes; la referencia o enlace a la fuente es opcional (DEC-26); conteos enteros acotados y datos completos por revisión. Comparar con operandos exactos, no con porcentajes redondeados de pantalla. La salud normaliza los valores respecto de estos objetivos según la fórmula aprobada.
- PDF hasta 3 MiB por archivo, individualmente por servidor; enlaces HTTP/HTTPS hasta 2048 caracteres, sin descarga de destinos. Los criterios por actividad están en el [catálogo](catalogo-actividades.md) y la aprobación sigue correspondiendo a QA.
- Un archivo físico tiene registro propio y puede tener referencias en varios intentos. No se sobrescribe ni se elimina mientras esté referenciado. Reservas de 30 minutos, compensación y limpieza administrativa diaria de objetos sin referencias durante al menos 24 horas, con reintentos seguros.
- Misma solicitud de alta y mismo contenido recuperan el proyecto ya creado; reutilizar la solicitud con otro contenido produce conflicto. La BD aplica versión esperada para edición/cierre y actividad, y revisión esperada al corregir mediciones.
- Reporte y PDF comparten captura cifrada de 15 minutos, ligada a QA/proyecto, sin histórico persistente. Captura máxima 1 MiB, petición de exportación 2 MiB y PDF 3 MiB; superar límites produce error, nunca omisión silenciosa de registros.
- Credenciales privilegiadas solo en adaptador de archivos/limpieza aislado y con autorización explícita. Mutaciones normales mediante RPC acotadas; lecturas por usuario con RLS. No usar ese adaptador como acceso genérico a proyectos, métricas o revisiones.

Límites restantes de texto, precisión y contratos: [diccionario](../datos/diccionario-datos.md), [detalle técnico](../datos/detalle-tecnico-v1.md) y [contratos](../arquitectura/contratos-v1.md).

## Salud aprobada

**APROBADO, 2026-10-30, DEC-27.** Definición funcional común de CU-05/06 y RF-26/27/29; sustituye la indefinición anterior sin modificar el diseño técnico por esta edición.

```text
S = Salud (%) = 100 × (A + SUM(C_i)) / (N_A + N_M)
A   = número de instancias de actividades SQA Aprobadas
N_A = número de instancias de actividades SQA planeadas/seleccionadas
N_M = número de métricas seleccionadas
C_i = aporte de cada métrica seleccionada, entre 0 y 1
```

Cada instancia de actividad y cada métrica tiene el mismo peso: 1 punto posible. Una actividad aporta 1 solo en Aprobada; Pendiente, En progreso y En revisión aportan 0. Las instancias repetidas cuentan individualmente; los tipos de métricas no se duplican por proyecto.

- M-01/02/03 con objetivo positivo: `C_i = min(1, valor_real / objetivo)`. El dominio no admite valores negativos y superar el objetivo no permite aportar más de 1. M-01 utiliza solo el porcentaje general, sin el criterio crítico independiente.
- M-04 con objetivo 0: aporta 1 si hay 0 defectos y 0 si hay uno o más. Con objetivo positivo aporta 1 si `valor_real ≤ objetivo`; si lo supera, `C_i = objetivo / valor_real`.
- Métrica seleccionada Sin medición o No evaluable: aporta 0 y permanece en `N_M`. Mostrar «evaluación parcial» e identificar los datos faltantes, sin convertir el valor medido ausente en un cero numérico.
- Si `N_A + N_M = 0`, mostrar «Sin evaluar»; no dividir entre cero. Si hay elementos planeados y ninguno aprobado o medido, puede resultar 0%: distinguirlo visualmente de «Sin evaluar» e informar la falta de datos.
- Por etapa: aplicar la misma fórmula a sus elementos, según etapa predefinida; una etapa sin elementos muestra «Sin evaluar». Se presentan siempre Especificación de requerimientos, Diseño del software y Desarrollo. M-01…M-04 pertenecen a Desarrollo.
- General: calcular directamente con todos los elementos; no promediar porcentajes de etapas. La distribución del catálogo da naturalmente mayor influencia a Desarrollo.

| Valor real de S, antes de redondear para pantalla | Clasificación |
|---|---|
| 0 ≤ S < 50 | Malo |
| 50 ≤ S < 70 | Regular |
| 70 ≤ S < 90 | Bueno |
| 90 ≤ S ≤ 100 | Excelente |

Si la última medición válida de M-04 es mayor que cero, advertir defectos graves abiertos, sin limitar puntuación ni clasificación. No haber medido no equivale a ausencia de defectos. Dashboard, vista del reporte y PDF utilizan la misma definición y resultados para el mismo estado/captura actual.

Ejemplo de aceptación: 5 actividades planeadas, 3 Aprobadas y 2 métricas con aportes 1 y 0.8: `100 × (3 + 1 + 0.8) / 7 = 68.571428…%`, mostrado 68.57%, clasificación Regular.

El objetivo porcentual cero no está cubierto por la división aprobada; no se establece fórmula alternativa ni restricción de esquema. Nulos técnicos y tratamiento histórico de objetivos modificados también requieren precisión en [pendientes](../requisitos/pendientes-y-brechas.md#pendientes-de-requisitos).

## Contenido del reporte

**APROBADO, 2026-10-30, DEC-28.** CU-06 es exclusivo de QA autorizado al proyecto, bajo demanda, consultable tras cierre y sin histórico de PDFs de reporte.

- Identificación del proyecto y fecha/hora de emisión en hora de CDMX (`America/Mexico_City`, DEC-24); las fechas de calendario conservan su día.
- Salud general y de cada una de las tres etapas: porcentaje cuando sea evaluable, clasificación y advertencias/condición parcial; «Sin evaluar» cuando no haya elementos.
- Actividades SQA: tipo e instancia, etapa, responsable, estado y referencias o enlaces a evidencias.
- Métricas: nombre, etapa, valor actual, objetivo, condición de medición y aporte/cumplimiento evaluable.
- Advertencias de defectos graves abiertos, información faltante y etapas sin elementos cuando corresponda.

Los PDF de evidencia no se incrustan en el PDF de reporte; sus enlaces/referencias mantienen controles de acceso. Dashboard, vista y PDF comparten los resultados de CU-05 y la misma información actual; una regeneración actualiza vista, captura y fecha. Permanecen las restricciones de captura, autorización y límites técnicos de ADR-001/002. [Brechas verificadas](../requisitos/pendientes-y-brechas.md#brechas-requisitos-aprobados--documentacióncódigo-existente).
