# Diagramas de QAlly

Representación documental de la implementación integrada en `dev` (CU-01 a CU-04), sin cambios de arquitectura, esquema ni reglas de negocio. Los diagramas son Mermaid editable y se visualizan en un visor Markdown compatible, como GitHub.

| Diagrama | Archivo |
|---|---|
| Arquitectura general | [arquitectura-general.md](arquitectura-general.md) |
| Secuencia CU-01 — Gestionar proyecto | [secuencia-CU-01.md](secuencia-CU-01.md) |
| Secuencia CU-02 — Gestionar métricas | [secuencia-CU-02.md](secuencia-CU-02.md) |
| Secuencia CU-03 — Gestionar actividad SQA | [secuencia-CU-03.md](secuencia-CU-03.md) |
| Secuencia CU-04 — Entregar evidencia | [secuencia-CU-04.md](secuencia-CU-04.md) |
| Entidad–relación con notación Chen | [entidad-relacion-chen.md](entidad-relacion-chen.md) |

Las secuencias agrupan los subflujos de cada CU: las secciones opcionales no implican que deban ejecutarse todas en una misma sesión. Los componentes dibujados dentro de Next.js son responsabilidades del mismo monolito, no servicios separados. Auth es una precondición transversal; no se añade un caso de uso nuevo.

El ER usa rectángulos para entidades, rombos para relaciones y nodos ovalados para atributos seleccionados. Mermaid `erDiagram` usa otra notación, por lo que esta vista Chen se expresa mediante `flowchart`. Complementa el [ER relacional completo](../datos/modelo-entidad-relacion.md), sin reemplazar sus restricciones ni el diccionario.

Fuentes canónicas: [arquitectura](../arquitectura/diseno-arquitectural.md), [contratos](../arquitectura/contratos-v1.md), [migraciones](../../supabase/migrations/) y [resultado de integración](../equipo/integracion-cu02-cu03-cu04.md). CU-05/06 y el algoritmo de salud siguen pendientes; no se incluyen como secuencias implementadas.
