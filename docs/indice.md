# Índice de documentación — carga selectiva para tareas

| Tarea | Documentos mínimos |
|---|---|
| Entender qué hace QAlly | `README.md`, `docs/producto/reglas-globales.md` |
| Conocer el stack oficial | `docs/arquitectura/stack-aprobado.md` |
| Consultar el diseño arquitectónico | `docs/arquitectura/diseno-arquitectural.md` → `C4-01-contexto.md`, `C4-02-contenedores.md`, `C4-03-componentes.md` en la misma carpeta |
| Integrar UI/BD y colaborar con Git | [Flujo de integración](equipo/integracion-ui-bd.md) |
| Preparar bootstrap | `docs/arquitectura/plan-de-diseno.md`, `docs/arquitectura/stack-aprobado.md`, `docs/decisiones/pendientes.md` |
| Preparar y usar la BD local | [Guía Supabase](datos/guia-supabase.md), [plan de bootstrap](datos/plan-bootstrap-supabase.md), migraciones/seed y contratos v1 |
| Proponer estructura de código | `docs/arquitectura/estructura-repo-propuesta.md`, plan de diseño |
| Consultar BD, permisos y evidencias | `docs/datos/invariantes-de-modelado.md` → `modelo-entidad-relacion.md`, `diccionario-datos.md`, `seguridad-integridad.md` en la misma carpeta; CU-01 a CU-04 según impacto |
| Probar CU-01 implementado | [Implementación local y pruebas](modulos/cu01-implementacion.md) |
| Probar CU-03 implementado | [Implementación local y pruebas](modulos/cu03-implementacion.md) |
| Probar CU-04 implementado | [Implementación local y pruebas](modulos/cu04-implementacion.md) |
| Implementar proyectos | `docs/modulos/proyectos.md` → CU-01 |
| Implementar o probar métricas | `docs/modulos/metricas.md` → CU-02; [implementación local y pruebas](modulos/cu02-implementacion.md) |
| Implementar actividades SQA | `docs/modulos/actividades.md` → CU-03 |
| Implementar entrega de evidencias | `docs/modulos/evidencias.md` → CU-04 |
| Implementar salud/dashboard | `docs/modulos/salud.md` → CU-05 y pendientes |
| Implementar reportes PDF | `docs/modulos/reportes.md` → CU-06 y CU-05 |
| Preparar SRS y casos de prueba | `docs/requisitos/trazabilidad.md`, CU y RF/RNF afectados |
| Consultar catálogos | `docs/producto/catalogo-actividades.md`, `docs/producto/catalogo-metricas.md` |
| Consultar decisiones | `docs/decisiones/registro.md`, `docs/decisiones/pendientes.md` |
| Consultar cierre de diseño excepto salud | [ADR-002](decisiones/ADR-002-cierre-diseno-v1.md), [contratos v1](arquitectura/contratos-v1.md), [detalle técnico](datos/detalle-tecnico-v1.md), **APROBADOS**; bootstrap local en guía Supabase |
| Onboarding de agentes (solo si se necesita) | `docs/equipo/guia-codex.md` |

## Fuentes canónicas

- **Producto:** `docs/producto/reglas-globales.md` y catálogos v1 aprobados por el usuario (ratificación académica no presumida).
- **Requisitos:** `docs/requisitos/funcionales.md` (33 RF), `docs/requisitos/no-funcionales.md` (10 RNF) y seis CU de 12 apartados en `docs/requisitos/casos-uso/`.
- **Tecnologías/estilo:** `docs/arquitectura/stack-aprobado.md` (**APROBADO**).
- **Diseño:** [arquitectura](arquitectura/diseno-arquitectural.md), [modelo ER](datos/modelo-entidad-relacion.md), [diccionario](datos/diccionario-datos.md) y [seguridad/integridad](datos/seguridad-integridad.md), documentados tras [ADR-001](decisiones/ADR-001-diseno-tecnico-v1.md) y [ADR-002](decisiones/ADR-002-cierre-diseno-v1.md). [Contratos](arquitectura/contratos-v1.md), límites y ajustes aprobados; SQL, seeds, RLS y tipos implementados en el bootstrap local; UI integrada; CU-01 a CU-04 conectados al backend local; consultar el estado de los demás casos en sus módulos.
- **Decisiones:** `docs/decisiones/registro.md`; **pendientes:** `docs/decisiones/pendientes.md`.

`docs/modulos/` son mapas de lectura; **no** reemplazan los CU ni autorizan decisiones nuevas. No cargar los seis CU para una tarea aislada. `AGENTS.md` define pautas permanentes, el README presenta el producto.
