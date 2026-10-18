# Alcance y reglas del producto

**Estado:** acuerdos actuales. **No** confundir con decisiones aún pendientes ni con arquitectura técnica aprobada.

## Propósito y contexto
QAlly administra proyectos de software, actividades SQA, evidencias, métricas y reportes de calidad. Se desarrolla como trabajo académico por cinco estudiantes. El stack tecnológico y el monolito modular están aprobados en `../arquitectura/stack-aprobado.md`. Se prevé uso de escritorio; el esquema de base de datos y detalles de implementación siguen por diseñarse.

El trabajo distingue **SQA ofrecido por el producto** de **SQA aplicado por el equipo para desarrollar QAlly**. Ver `docs/equipo/sqa-en-el-desarrollo.md`.

## Roles y seguridad
- **QA:** gestiona proyectos, catálogos seleccionados, asignaciones, mediciones, revisiones y reportes.
- **Miembro del equipo:** consulta proyectos autorizados; inicia/entrega actividades asignadas; consulta indicadores/salud.
- No hay rol PM en el producto. La autenticación es precondición; se previeron cuentas semilla para primera iteración.
- Comprobar rol y acceso a proyecto **en el servidor**; proteger también evidencias y accesos directos.

## Etapas, catálogos y proyectos
- Etapas fijas: **Especificación de requerimientos**, **Diseño del software**, **Desarrollo**.
- Los tipos de actividades y métricas provienen de **catálogos cerrados**; las etapas están preasignadas desde el catálogo. Las listas concretas siguen **preliminares**.
- QA selecciona actividades iniciales (algunas preseleccionadas, pero desmarcables), selecciona métricas/umbrales y agrega instancias posteriormente.
- Una actividad del catálogo puede tener **múltiples instancias** por proyecto. Un tipo de métrica solo aparece **una vez** por proyecto.
- Un proyecto cerrado conserva su información consultable; operaciones bloqueadas exactas todavía requieren acuerdo.

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

## Métricas y reportes
- QA configura umbrales, registra mediciones históricas y puede corregir un dato con rastro mínimo de **valor anterior, valor corregido, autor, fecha/hora**.
- La última medición vigente determina el valor actual; **Sin medición ≠ 0**. Las tasas sin denominador evaluable no se califican arbitrariamente.
- La salud general y por las tres etapas **está dentro del alcance**, pero fórmula, pesos y categorías **siguen pendientes**. Puede presentarse «Sin evaluar» sin inventar puntaje.
- QA genera reportes del **estado actual**, los ve dentro de QAlly y los exporta a PDF. Dashboard y reportes deben mostrar las mismas cifras y utilizar un único cálculo de salud cuando exista.

## Alcance no comprometido
No dar por acordados: módulos completos de defectos o cuentas, integraciones obligatorias con GitHub, métricas/actividades personalizadas por los usuarios, histórico de PDFs, filtros analíticos avanzados, tercer rol PM, algoritmo de salud supuesto o soporte móvil como requisito.

## Detalles aún abiertos
Ver `../decisiones/pendientes.md`: definición de salud, actividades/evidencias definitivas, etapas de métricas, "un proyecto por periodo", campos y cierre del proyecto.
