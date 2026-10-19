# Alcance y reglas del producto

**Estado:** acuerdos actuales. **No** confundir con decisiones aún pendientes ni con arquitectura técnica aprobada.

## Propósito y contexto
QAlly administra proyectos de software, actividades SQA, evidencias, métricas y reportes de calidad. Se desarrolla como trabajo académico por cinco estudiantes. El stack tecnológico y el monolito modular están aprobados en `../arquitectura/stack-aprobado.md`. Se prevé uso de escritorio. El diseño técnico inicial está documentado en [arquitectura](../arquitectura/diseno-arquitectural.md) y [datos](../datos/modelo-entidad-relacion.md); su implementación sigue pendiente.

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
- QA selecciona actividades iniciales (A-01, A-03, A-05, A-06 y A-09 preseleccionadas, pero desmarcables), selecciona métricas/umbrales y agrega instancias posteriormente.
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
- La salud general y por las tres etapas **está dentro del alcance**, pero fórmula, pesos y categorías **siguen pendientes**. Puede presentarse «Sin evaluar» sin inventar puntaje.
- QA genera reportes del **estado actual**, los ve dentro de QAlly y los exporta a PDF. Dashboard y reportes deben mostrar las mismas cifras y utilizar un único cálculo de salud cuando exista.

## Alcance no comprometido
No dar por acordados: módulos completos de defectos o cuentas, integraciones obligatorias con GitHub, métricas/actividades personalizadas por los usuarios, histórico de PDFs, filtros analíticos avanzados, tercer rol PM, algoritmo de salud supuesto o soporte móvil como requisito.

## Detalles aún abiertos
El algoritmo y clasificación de salud siguen pendientes. [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md) cierra catálogos, periodo, archivos, contratos y ajustes del esquema. [Pendientes](../decisiones/pendientes.md) distingue salud de implementación, bootstrap y validación académica posterior.

## Reglas concretas de la versión — ADR-002

- M-01..M-04 pertenecen a Desarrollo y se capturan manualmente según el [catálogo](catalogo-metricas.md). Objetivos iniciales configurables: 90% general y 100% crítico en M-01; 100% en M-02/03; 0 en M-04. Comparador fijo por tipo. La ausencia de muestra crítica en M-01 impide declarar cumplimiento conjunto, aunque el valor general sea evaluable.
- Cada medición incluye fecha y fuente; conteos enteros acotados y datos completos por revisión. Comparar con operandos exactos, no con porcentajes redondeados de pantalla. No se calcula salud a partir de estos objetivos.
- PDF hasta 3 MiB por archivo, individualmente por servidor; enlaces HTTP/HTTPS hasta 2048 caracteres, sin descarga de destinos. Los criterios por actividad están en el [catálogo](catalogo-actividades.md) y la aprobación sigue correspondiendo a QA.
- Un archivo físico tiene registro propio y puede tener referencias en varios intentos. No se sobrescribe ni se elimina mientras esté referenciado. Reservas de 30 minutos, compensación y limpieza administrativa diaria de objetos sin referencias durante al menos 24 horas, con reintentos seguros.
- Misma solicitud de alta y mismo contenido recuperan el proyecto ya creado; reutilizar la solicitud con otro contenido produce conflicto. La BD aplica versión esperada para edición/cierre y actividad, y revisión esperada al corregir mediciones.
- Reporte y PDF comparten captura cifrada de 15 minutos, ligada a QA/proyecto, sin histórico persistente. Captura máxima 1 MiB, petición de exportación 2 MiB y PDF 3 MiB; superar límites produce error, nunca omisión silenciosa de registros.
- Credenciales privilegiadas solo en adaptador de archivos/limpieza aislado y con autorización explícita. Mutaciones normales mediante RPC acotadas; lecturas por usuario con RLS. No usar ese adaptador como acceso genérico a proyectos, métricas o revisiones.

Límites restantes de texto, precisión y contratos: [diccionario](../datos/diccionario-datos.md), [detalle técnico](../datos/detalle-tecnico-v1.md) y [contratos](../arquitectura/contratos-v1.md).
