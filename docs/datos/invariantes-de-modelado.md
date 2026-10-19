# Invariantes del dominio y diseño de PostgreSQL

**Estado:** reglas funcionales, PostgreSQL/Supabase y estrategia de migraciones **APROBADOS**. Diseño ER y controles documentados tras [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md); ADR-002 cierra tipos, límites, contratos y diseño de políticas; SQL ejecutable y comprobación en ejecución aún pendientes.

## Restricciones que debe satisfacer el esquema

1. Dos roles globales de producto: QA y Miembro del equipo; identidad en Supabase Auth, rol en perfil protegido y acceso en participación usuario–proyecto. QA creador se incorpora en el alta. Nunca confiar en un rol indicado por el cliente.
2. Solo usuarios autorizados acceden a datos y evidencias de su proyecto: servidor + **RLS** y políticas de Supabase Storage. Especificar permisos para proyectos, miembros, métricas, actividades, mediciones y archivos.
3. Catálogo de tipos de actividad distinto de las instancias del proyecto; **un tipo puede repetirse** en un proyecto.
4. Catálogo de tipos de métrica distinto de métricas configuradas; **unicidad (proyecto, tipo de métrica)**.
5. Los tipos del catálogo tienen etapa predefinida entre tres opciones; aplicar FK y catálogos v1 aprobados; los cambios posteriores en datos usados requieren migración revisada.
6. El responsable de actividad pertenece al proyecto. Solo el asignado inicia/entrega; QA aprueba o devuelve; transiciones autorizadas y evidencia/revisión trazables.
7. Antes de pasar a En revisión: resultado y PDF o enlace. Estados En revisión y Aprobada sin edición ordinaria; devolución con observaciones a En progreso.
8. Mediciones persistentes; corrección por revisiones inmutables con **anterior, nuevo, autor y fecha/hora**, sin pérdida del original. Vigencia por fecha de medición y desempate estable de registro; corregir una antigua no la convierte en actual.
9. **Sin medición no es 0**; los denominadores de tasas pueden ser 0 y deben tratarse como no evaluables, no como incumplimiento asumido.
10. Proyecto cerrado conserva consulta, evidencias y reportes según rol; se bloquean todas las escrituras de negocio. Sin reapertura ordinaria.
11. Salud/dashboard y reportes consumen datos persistidos y resultados coherentes; no materializar porcentajes o categorías de salud no aprobados.
12. Cada entrega enviada conserva su resultado y evidencias como intento inmutable; la devolución habilita otro intento, conservando revisión y observaciones.
13. Proyecto exige nombre, descripción e inicio. Periodo y fin previsto opcionales, fin no anterior al inicio. Sin unicidad por periodo. Metadata automática de creación, actualización y cierre.

## Implementación futura del diseño

- Versionar estructura, políticas RLS, funciones y semillas mediante `supabase/migrations/` y `supabase/seed.sql`.
- Justificar índices, constraints, claves foráneas, fechas y estrategia de integridad transaccional.
- Guardar PDFs en bucket privado; la base almacena referencias/metadata, no el contenido binario.
- **Cuidado:** una transacción SQL no incluye automáticamente la carga de objetos a Storage; diseñar validación y compensación/limpieza si falla la secuencia (RNF-09).
- No exponer claves privilegiadas en el cliente ni eludir RLS con accesos de servicio sin autorización adicional.

**Fuentes:** CU-01 a CU-04, RF-01 a RF-25, RF-33, RNF-01 a RNF-03, RNF-08 a RNF-10; consultar CU-05/06 para consultas/reportes.

**Diseño documentado:** [ER](modelo-entidad-relacion.md), [diccionario](diccionario-datos.md), [seguridad/integridad](seguridad-integridad.md). Implementación definitiva, migraciones, semillas ejecutables y pruebas requieren una tarea posterior autorizada; no se generan en este alcance.

## Ajustes aprobados en ADR-002

14. Archivo físico separado en `archivo_evidencia`; `evidencia.archivo_id` FK para PDF y URL alternativa para enlace, exclusivos. Confirmación/limpieza coordinadas por bloqueo; ningún archivo referenciado puede eliminarse. Reserva/Disponible/Eliminando/Eliminado son estados técnicos, no estados de actividad.
15. Proyecto incluye versión y unicidad `(creado_por, solicitud_creacion_id)` con hash normalizado del alta. Periodo no único: varios proyectos permitidos.
16. M-01 exige objetivo general y `objetivo_critico`; objetivo_superior retirado, sin intervalos. Cuatro métricas en Desarrollo, reglas y fórmulas en catálogo aprobado, valores `numeric(20,8)` y objetivos porcentuales con hasta cuatro decimales.
17. PDF máximo 3 MiB, reserva 30 minutos, transferencia máxima 60 segundos, limpieza diaria tras 24 horas sin referencias; la carga validada se media por servidor. Acceso privilegiado aislado de archivos aprobado solo con controles de [seguridad e integridad](seguridad-integridad.md).
18. Reportes con captura cifrada/autenticada de 15 minutos y autorización actual al exportar; sin historial persistente, sin depender de memoria local entre instancias.

[ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md), [detalle técnico](detalle-tecnico-v1.md) y [contratos](../arquitectura/contratos-v1.md) forman parte de la línea base documental, no una autorización para ejecutar migraciones.
