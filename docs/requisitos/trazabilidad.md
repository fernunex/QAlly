## 8. Matriz de trazabilidad CU–RF–RNF

| **Caso de uso** | **RF relacionados**  | **RNF relacionados**                   |
|-----------------|----------------------|----------------------------------------|
| CU-01           | RF-01 a RF-07; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09     |
| CU-02           | RF-08 a RF-14; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09, 10 |
| CU-03           | RF-15 a RF-19; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09     |
| CU-04           | RF-20 a RF-25; RF-33 | RNF-01, 02, 03, 04, 05, 07, 08, 09     |
| CU-05           | RF-26 a RF-29; RF-33 | RNF-01, 02, 03, 04, 07                 |
| CU-06           | RF-30 a RF-32; RF-33 | RNF-01, 02, 03, 06, 07                 |

**Uso:** ajustar referencias cuando se modifique un RF, RNF o CU. Consultar documentos canónicos para detalles.

## Trazabilidad con diseño aprobado — 2026-10-18

Se conservan los 33 RF, diez RNF y sus identificadores. [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md) precisa campos/cierre, rol global con acceso por proyecto, intentos y correcciones; no incorpora módulos nuevos. [C3](../arquitectura/C4-03-componentes.md) incluye la matriz componentes–CU y [diseño arquitectural](../arquitectura/diseno-arquitectural.md) valida la coherencia C4–datos–CU–RNF.

| CU | Decisiones y datos vinculados | Control relevante |
|---|---|---|
| CU-01 | Proyecto, participación y configuración inicial; campos y cierre de solo lectura. | RF-01–07, 33; RNF-01–05, 07–09. |
| CU-02 | Métrica por proyecto única, medición y revisiones inmutables; vigencia temporal estable. | RF-08–14, 33; RNF-01–05, 07–10. |
| CU-03 | Actividad repetible, responsable del proyecto y revisión de entrega. | RF-15–19, 33; RNF-01–05, 07–09. |
| CU-04 | Intentos de entrega y evidencias privadas, envío atómico con compensación de archivos. | RF-20–25, 33; RNF-01–05, 07–09. |
| CU-05 | Lecturas de actividades y mediciones vigentes agrupadas por tres etapas. | RF-26–29, 33; RNF-01–04, 07. Algoritmo/clasificación aún pendientes. |
| CU-06 | Resumen común y captura consistente para vista/PDF; consulta tras cierre. | RF-30–32, 33; RNF-01–03, 06–07. |

Entidades/llaves: [modelo ER](../datos/modelo-entidad-relacion.md) y [diccionario](../datos/diccionario-datos.md). Políticas previstas, transacciones y escenarios de aceptación: [seguridad e integridad](../datos/seguridad-integridad.md). Esta revisión documental no equivale a pruebas de ejecución.

## Cierre aprobado — ADR-002

[ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md) incorpora reglas y ajustes concretos al esquema; [contratos v1](../arquitectura/contratos-v1.md), [catálogos](../producto/catalogo-actividades.md), [diccionario](../datos/diccionario-datos.md) y [seguridad](../datos/seguridad-integridad.md) son fuentes vigentes.

| Acuerdo | CU / RF | RNF y control |
|---|---|---|
| Periodo libre, preselección y alta idempotente con proyecto.version/solicitud/hash. | CU-01; RF-01–07, 33. | RNF-01–05, 07–09; reintento sin duplicados y cierre concurrente. |
| Cuatro métricas en Desarrollo, objetivo_critico de M-01, operandos exactos y captura/revisión completas. | CU-01/02/05/06; RF-03, 08–14, 28–32, 33. | RNF-08–10; original intacto, corrección antigua no desplaza vigente y cero no equivale a ausencia. |
| Criterios de evidencia por actividad, archivo_evidencia y FK evidencia.archivo_id. | CU-03/04; RF-15–25, 33. | RNF-01–03, 08–09; PDF privado, referencias preservadas y limpieza sin carreras. |
| PDF 3 MiB, reserva 30 minutos, limpieza diaria a partir de 24 horas sin referencias; adaptador privilegiado acotado. | CU-04; RF-23–25, 33. | RNF-02–03, 09; llamadas directas no eluden validación, fallos no confirman entregas. |
| Captura cifrada 15 minutos, límites explícitos y autorización al exportar. | CU-06; RF-30–33. | RNF-01–03, 06–07; vista/PDF coinciden y token alterado/expirado/ajeno rechazado. |
| Salud sigue Sin evaluar sin algoritmo ni categorías definitivas. | CU-05/06; RF-26–29, 30–32. | Conserva alcance pendiente; no se demuestra cálculo inexistente. |

Las verificaciones anteriores son escenarios exigidos al implementar, no resultados de ejecución. Se conservan los seis CU de doce apartados y diez RNF.
