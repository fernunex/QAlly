# Invariantes del dominio y diseño de PostgreSQL

**Estado:** reglas funcionales aprobadas; PostgreSQL/Supabase y migraciones SQL **aprobados**; **modelo ER y políticas concretas pendientes**.

## Restricciones que debe satisfacer el esquema

1. Dos roles de producto: QA y Miembro; la identidad proviene de Supabase Auth. Separar identidad, rol y asociación usuario–proyecto según se justifique. Nunca confiar solo en el rol indicado por el cliente.
2. Solo usuarios autorizados acceden a datos y evidencias de su proyecto: servidor + **RLS** y políticas de Supabase Storage. Especificar permisos para proyectos, miembros, métricas, actividades, mediciones y archivos.
3. Catálogo de tipos de actividad distinto de las instancias del proyecto; **un tipo puede repetirse** en un proyecto.
4. Catálogo de tipos de métrica distinto de métricas configuradas; **unicidad (proyecto, tipo de métrica)**.
5. Los tipos del catálogo tienen etapa predefinida entre tres opciones; considerar claves/constraint sin impedir actualizar semillas preliminares.
6. El responsable de actividad pertenece al proyecto. Solo el asignado inicia/entrega; QA aprueba o devuelve; transiciones autorizadas y evidencia/revisión trazables.
7. Antes de pasar a En revisión: resultado y PDF o enlace. Estados En revisión y Aprobada sin edición ordinaria; devolución con observaciones a En progreso.
8. Mediciones persistentes; corrección auditable con **anterior, nuevo, autor y fecha/hora**, sin pérdida del historial. Último valor vigente y corrección deben ser coherentes.
9. **Sin medición no es 0**; los denominadores de tasas pueden ser 0 y deben tratarse como no evaluables, no como incumplimiento asumido.
10. Proyecto cerrado conserva consulta; detalles de escritura prohibida siguen pendientes de definición.
11. Salud/dashboard y reportes consumen datos persistidos y resultados coherentes; no materializar porcentajes o categorías de salud no aprobados.

## Enfoque técnico para evaluar (no diseño final)

- Versionar estructura, políticas RLS, funciones y semillas mediante `supabase/migrations/` y `supabase/seed.sql`.
- Justificar índices, constraints, claves foráneas, fechas y estrategia de integridad transaccional.
- Guardar PDFs en bucket privado; la base almacena referencias/metadata, no el contenido binario.
- **Cuidado:** una transacción SQL no incluye automáticamente la carga de objetos a Storage; diseñar validación y compensación/limpieza si falla la secuencia (RNF-09).
- No exponer claves privilegiadas en el cliente ni eludir RLS con accesos de servicio sin autorización adicional.

**Fuentes:** CU-01 a CU-04, RF-01 a RF-25, RF-33, RNF-01 a RNF-03, RNF-08 a RNF-10; consultar CU-05/06 para consultas/reportes.

**Entregables:** diagrama ER, SQL/migraciones propuestas, políticas RLS, modelo de archivos, seeds y escenarios de prueba de autorización/integridad. Presentar para aprobación antes de generar implementación definitiva.
