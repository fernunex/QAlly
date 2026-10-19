# ADR-002 — Cierre de diseño v1, excepto salud

**Fecha: 2026-10-18. Estado: APROBADO por el usuario.**

## Contexto y autorización

Tras ADR-001 se presentó el [cierre de diseño](propuesta-cierre-diseno-v1.md), acompañado de contratos y detalle técnico. El usuario aprobó expresamente: «si apruebo. incluye las reglas y ajustes concretos al esquema». Se consolidan esos acuerdos en las fuentes canónicas. La aprobación comprende diseño documental y no autoriza implementación, SQL ejecutable, instalaciones, cambios en Supabase, push o despliegue.

## Reglas aprobadas

- Catálogo A-01..A-10 con etapas, resultados/evidencias y criterios de revisión. Preselección editable: A-01, A-03, A-05, A-06 y A-09. QA decide aprobación, sin automatizarla por métricas.
- Catálogo M-01..M-04 con captura manual y etapa Desarrollo; fórmulas existentes conservadas, fuentes obligatorias y restricciones de conteos. Objetivos iniciales configurables: M-01 general 90% y crítico 100%, M-02/03 100%, M-04 0. Comparador fijo por tipo, sin intervalos.
- Periodo como etiqueta opcional de hasta 40 caracteres, múltiples proyectos permitidos; no hay regla de un proyecto por periodo.
- PDF hasta 3 MiB por archivo, transferencia binaria individual por servidor y validación básica de formato. Reserva 30 minutos; transferencia máximo 60 segundos; compensación y limpieza administrativa diaria por lotes de 100, ordinariamente después de 24 horas sin referencias. No se presume validación antimalware.
- Reporte con captura cifrada AES-256-GCM, duración 15 minutos, ligada a usuario/proyecto y autorización renovada al exportar. Captura hasta 1 MiB, petición de exportación 2 MiB y PDF 3 MiB; sin truncamiento ni histórico persistente.
- Mutaciones ordinarias solo mediante RPC definidoras acotadas con autorización interna, privilegios explícitos y RLS para lecturas. Credencial privilegiada aislada para archivos y limpieza, con controles explícitos porque elude RLS; prohibida como cliente de negocio genérico.
- Contratos de entradas, salidas, errores, paginación, concurrencia e idempotencia establecidos en [contratos v1](../arquitectura/contratos-v1.md).

## Ajustes concretos al esquema

| Cambio | Regla / justificación |
|---|---|
| Proyecto: version bigint | Controlar edición/cierre concurrentes; inicial 1, escritura con versión esperada. |
| Proyecto: solicitud_creacion_id UUID y solicitud_creacion_hash char(64) | Unicidad creador/solicitud; SHA-256 del payload normalizado en BD. Reintento idéntico recupera alta; distinto contenido produce conflicto. |
| Métrica de proyecto: objetivo_critico numeric(20,8) | Obligatorio solo para M-01. Conserva meta de flujos críticos; sin muestra crítica, cumplimiento conjunto No evaluable. |
| Retirar objetivo_superior del diseño | V1 no usa intervalos; nunca se implementó esa columna. |
| Nueva archivo_evidencia | Una fila por objeto físico con proyecto, origen, autor, ruta única, nombre, MIME, bytes, SHA-256, estado y fechas de reserva/referencias. Permite reutilización y limpieza sin perder PDF revisados. |
| Evidencia: archivo_id FK nullable | PDF exige archivo Disponible del mismo proyecto y URL nula; enlace exige URL y archivo nulo. Metadata física se mueve a archivo_evidencia. |
| Descripciones obligatorias | Tipo e instancia hasta 5000 caracteres; alta inicial copia catálogo, CU-03 aporta descripción específica. |
| Límites y precisión | Nombre de proyecto 200, perfil 120, resultado 20000, observaciones 10000, URL/fuente 2048; valores numeric(20,8), objetivos porcentuales hasta cuatro decimales, conteos hasta 1 000 000 000. |

PK, FK, unicidades e índices completos en [ER](../datos/modelo-entidad-relacion.md), [diccionario](../datos/diccionario-datos.md) y [detalle técnico](../datos/detalle-tecnico-v1.md). No se crea una FK de producto sobre tablas internas de Storage ni se guarda el binario en PostgreSQL.

## Alternativas y consecuencias

Un único campo de evidencia con metadata duplicada dificultaría compartir objetos y bloquear la limpieza; se elige archivo separado y referencias. Subidas directas del cliente podrían saltarse validación de contenido; se elige transferencia mediada y adaptador privilegiado restringido. Memoria local para reportes no garantiza continuidad entre instancias serverless, y un histórico o Redis ampliaría alcance; se elige captura cifrada autocontenida. No se distribuyen métricas entre etapas sin corresponder con lo medido: las cuatro actuales son de Desarrollo y las otras etapas conservan sus actividades e indicadores.

Se conservan stack, monolito, dos roles, etapas, actividad repetible y métrica única, intentos y correcciones trazables y cierre de solo lectura de ADR-001. El registro histórico ADR-001 no se reescribe. Los archivos de propuesta se conservan como antecedentes identificados, no como contratos operativos.

## Pendientes y trazabilidad

**Salud sigue PENDIENTE por instrucción expresa:** algoritmo, pesos, clasificación y tratamiento global/por etapa. No se elimina RF-26/27; se muestran datos reales y Sin evaluar. No se presume ratificación académica de la docente.

Quedan fuera de esta aprobación la implementación y sus pruebas, versiones/configuración de bootstrap y revisión de entregables académicos no disponibles. No son decisiones de producto pendientes de este cierre.

CU-01: periodo, selección, objetivos e idempotencia; CU-02: capturas/objetivos/revisiones; CU-03/04: evidencia por tipo, archivos y transacciones; CU-05/06: resumen y captura de reporte. Se actualiza [trazabilidad CU–RF–RNF](../requisitos/trazabilidad.md), conservando 33 RF y diez RNF sin renumerar.
