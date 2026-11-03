# Secuencia CU-03 — Gestionar actividad SQA

QA participante crea, asigna y revisa en proyectos abiertos. Los participantes autorizados consultan tablero y detalle. El responsable inicia y envía desde CU-04; la asignación no inicia automáticamente la actividad.

```mermaid
sequenceDiagram
    autonumber
    actor U as QA / Miembro del equipo
    participant UI as Tablero y detalle React
    participant APP as Next.js / Actividades
    participant AUTH as Supabase Auth
    participant DB as PostgreSQL / RLS / RPC
    participant ST as Storage privado

    U->>UI: Abrir actividades del proyecto
    UI->>APP: Solicitar tablero con filtros de etapa y responsable
    APP->>AUTH: Verificar identidad
    AUTH-->>APP: Identidad verificada
    APP->>DB: Verificar participación, consultar columnas por estado con RLS
    DB-->>APP: Página por estado, totales y cursores
    APP-->>UI: Tablero autorizado
    opt SF-02 — Consultar actividad
        U->>UI: Abrir detalle / cargar intentos anteriores
        UI->>APP: consultarActividadAction con actividadId y cursor
        APP->>DB: Leer detalle e intentos enviados paginados
        DB-->>APP: Resultado, evidencias y revisiones permitidas
        APP-->>UI: Detalle e historial inmutable
    end

    opt SF-01 — Agregar actividad (QA, abierto)
        U->>UI: Elegir tipo de catálogo y descripción específica
        UI->>APP: agregarActividadAction
        APP->>APP: Validar QA, proyecto abierto y entrada
        APP->>DB: agregar_actividad
        DB->>DB: Validar tipo activo y crear instancia Pendiente
        DB-->>APP: Actividad sin responsable
        APP-->>UI: Confirmar y actualizar tablero
        Note over APP,DB: El mismo tipo de actividad puede repetirse en el proyecto.
    end

    opt SF-03 — Asignar responsable (QA, actividad Pendiente)
        U->>UI: Elegir Miembro participante del proyecto
        UI->>APP: asignarResponsableAction con versionEsperada
        APP->>APP: Verificar permisos, proyecto y miembro elegible
        APP->>DB: asignar_responsable
        DB->>DB: Validar pertenencia, rol, estado y versión
        DB-->>APP: Asignación confirmada, sigue Pendiente
        APP-->>UI: Responsable actualizado
    end

    opt Consultar PDF de evidencia permitido
        U->>UI: Descargar PDF
        UI->>APP: GET /api/evidencias/{evidenciaId}/archivo
        APP->>DB: Leer evidencia y archivo usando sesión y RLS
        DB-->>APP: Ruta autorizada y nombre del archivo disponible
        APP->>ST: Descargar con identidad del usuario y política privada
        ST-->>APP: PDF permitido
        APP-->>U: Adjunto privado, no-store y nosniff
    end

    opt SF-04 / SF-05 — Revisar un intento En revisión (QA, abierto)
        Note over UI,DB: El Miembro ya envió un intento mediante CU-04.
        U->>UI: Revisar resultado y evidencias
        alt Aprobar tras confirmación
            U->>UI: Confirmar Aprobar
            UI->>APP: aprobarEntregaAction con entregaId y versionEsperada
            APP->>APP: Validar QA, participación, apertura y entrada
            APP->>DB: revisar_entrega con decisión fija Aprobar
            DB->>DB: Validar estado, versión y resultado/evidencia
            DB->>DB: Transacción: registrar revisión QA y pasar a Aprobada
        else Devolver con observaciones obligatorias
            U->>UI: Escribir observaciones y devolver
            UI->>APP: devolverEntregaAction con entregaId y versionEsperada
            APP->>APP: Validar permisos y observaciones no vacías
            APP->>DB: revisar_entrega con decisión fija Devolver
            DB->>DB: Transacción: conservar intento, registrar revisión y pasar a En progreso
        end
        DB-->>APP: Revisión y actividad actualizadas, o rechazo sin escritura parcial
        APP->>DB: Releer detalle autorizado
        DB-->>APP: Datos persistidos
        APP-->>UI: Confirmación y tablero actualizado
    end
    Note over APP,DB: Estado o versión obsoletos producen CONFLICTO, una entrega se revisa una sola vez.<br/>Un proyecto cerrado conserva consulta y descarga, sin altas, asignaciones ni revisiones.
```

Los borradores de entrega del responsable no se exponen como intentos enviados al consultar el detalle de QA. La devolución habilita una corrección mediante un nuevo intento de CU-04; no edita el intento revisado.

Fuentes: [CU-03 implementado](../modulos/cu03-implementacion.md), [acciones](../../src/features/activities/actions.ts) y [descarga](../../src/app/api/evidencias/[evidenciaId]/archivo/route.ts).
