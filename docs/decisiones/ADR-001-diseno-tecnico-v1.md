# ADR-001 — Diseño técnico inicial de QAlly

**Fecha:** 2026-10-18. **Estado: APROBADO por el usuario.**

## Contexto y aprobación

El stack y monolito modular ya estaban aprobados (DEC-21/22). Se presentó una propuesta de C1–C3, modelo conceptual, permisos, integridad y asuntos pendientes. El usuario autorizó campos generales significativos para esta versión y después respondió «Los demas puntos me parecen bien». Esta aprobación cierra las decisiones de diseño propuestas; no autoriza implementación, instalaciones, migraciones ejecutables, Supabase, push ni despliegue.

## Decisiones y justificación

| Acuerdo | Decisión aprobada | Alternativa y motivo |
|---|---|---|
| Arquitectura | Una aplicación Next.js modular con Supabase Auth/PostgreSQL/Storage y despliegue Vercel. | Backend separado y servicios adicionales aumentarían coordinación sin necesidad del alcance. Se ratifica el stack existente. |
| Identidad y acceso (S1) | Rol global en perfil y pertenencia explícita usuario–proyecto; QA creador se incorpora al crear. | Roles distintos por proyecto añaden complejidad y no son necesarios para esta versión. QA no obtiene acceso global por su rol. |
| Entregas (S2) | Cada envío congela resultado y evidencias de un intento; devolución permite otro intento. | Sobrescribir lo revisado pierde trazabilidad. |
| Mediciones (S3) | Medición más reciente por fecha medida, desempate estable de registro; correcciones anexan revisiones sin alterar esa identidad temporal. | Actualizar destructivamente o tratar una corrección antigua como nueva medición pierde rastro o altera el valor vigente. |
| Campos del proyecto | Obligatorios: nombre, descripción, inicio. Opcionales: periodo académico y fin previsto; este no precede al inicio. Metadata automática de identidad, creación, actualización y cierre. | Evita bloquear la versión por una ficha extensa aún no definida. Campos revisables mediante cambio documentado. |
| Periodo | Etiqueta informativa, sin unicidad. | El significado de «un proyecto por periodo» sigue pendiente y no se implementa por suposición. |
| Cierre | Todas las escrituras de negocio bloqueadas; datos, evidencias y reportes disponibles según permisos. Sin reapertura ordinaria. | Excepciones de edición complican el cierre y no se han solicitado. |
| Catálogos | Tablas separadas de instancias; actividad repetible, métrica única por proyecto; tipos retirados conservados. | Catálogos como enums o copias de texto dificultan cambios y referencias históricas. |
| Seguridad e integridad | Servidor + RLS + privilegios/restricciones; operaciones compuestas transaccionales; Storage privado con validación y compensación. | Controles solo visuales o varias llamadas independientes no satisfacen RF-33 y RNF-09/10. |
| Salud y reportes | Datos de entrada y resumen común; Sin evaluar sin algoritmo; vista y PDF de una captura, sin historial persistente de reportes. | Puntajes supuestos y cálculos duplicados contradicen pendientes y coherencia CU-05/06. |

## Consecuencias y límites

El modelo aprobado puede documentarse y servir de base de revisión de SQL/contratos. Los detalles derivados del diccionario especifican la realización del modelo, pero no añaden funcionalidades. El código y las migraciones requieren una tarea posterior autorizada. La estructura física de carpetas sigue siendo propuesta.

Permanecen abiertos: fórmula/escala de salud; catálogo final de actividades y métricas; preselecciones y evidencias por tipo; fórmulas, etapas y datos fuente de métricas; regla de periodo; límite PDF y limpieza; firmas y SQL exactos, idempotencia del alta, captura temporal del reporte; configuración, versiones y pruebas en ejecución.

## Documentos afectados y trazabilidad

- C4-01, C4-02 y C4-03, [diseño arquitectural](../arquitectura/diseno-arquitectural.md), [ER](../datos/modelo-entidad-relacion.md), [diccionario](../datos/diccionario-datos.md) y [seguridad/integridad](../datos/seguridad-integridad.md).
- Reglas globales, invariantes, plan de diseño, stack (estado del detalle), índice, registro y pendientes.
- CU-01: campos/cierre/roles; CU-02: orden y correcciones; CU-03/04: intentos y revisión; CU-05/06: resumen coherente y salud pendiente. [Matriz CU–RF–RNF](../requisitos/trazabilidad.md).
- RF-01–33 y RNF-01–10 se conservan sin renumerar ni introducir requisitos nuevos. RF-26 y la clasificación final de RF-27 siguen pendientes del algoritmo.
