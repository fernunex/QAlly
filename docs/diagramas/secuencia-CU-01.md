# Secuencia CU-01 — Gestionar proyecto

Actores: QA realiza altas, edición y cierre; QA y Miembro del equipo consultan únicamente proyectos autorizados. Las operaciones de escritura son alternativas disponibles, no pasos obligatorios de una misma ejecución.

```mermaid
sequenceDiagram
    autonumber
    actor U as QA / Miembro del equipo
    participant UI as Interfaz React
    participant APP as Next.js / Proyectos
    participant AUTH as Supabase Auth
    participant DB as PostgreSQL / RLS / RPC

    U->>UI: Abrir proyectos
    UI->>APP: Solicitar listado o detalle
    APP->>AUTH: Verificar identidad y renovar sesión si corresponde
    AUTH-->>APP: Identidad verificada
    APP->>DB: Leer perfil, participación y proyectos con sesión del usuario
    DB-->>APP: Datos autorizados por RLS y página de resultados
    APP-->>UI: Lista / detalle autorizado
    UI-->>U: Mostrar proyecto y configuración

    opt SF-01 — Registrar proyecto (solo QA)
        U->>UI: Completar datos, miembros, actividades y métricas
        UI->>APP: Consultar catálogos y buscar miembros elegibles
        APP->>DB: Lecturas protegidas y buscar_miembros_elegibles
        DB-->>APP: Tipos activos, etapas y miembros
        APP-->>UI: Opciones válidas y paginadas
        U->>UI: Confirmar creación
        UI->>APP: crearProyectoAction con solicitudId estable y selecciones
        APP->>APP: Validar sesión, rol QA, entrada estricta y catálogo
        APP->>DB: crear_proyecto(payload, solicitudId)
        DB->>DB: Reautorizar y validar, deduplicar solicitud
        DB->>DB: Transacción: proyecto, participaciones y configuración inicial
        DB-->>APP: Proyecto creado o alta idéntica ya confirmada
        APP->>DB: Consultar proyecto autorizado
        DB-->>APP: Detalle persistido
        APP-->>UI: Confirmación y revalidación de rutas
        UI-->>U: Mostrar proyecto creado
        Note over UI,DB: Respuesta perdida: reintentar con el mismo ID y contenido no duplica el proyecto.
    end

    opt SF-03 — Editar datos generales (QA participante, abierto)
        U->>UI: Guardar datos generales
        UI->>APP: editarProyectoAction con versionEsperada
        APP->>APP: Verificar identidad, rol, participación, estado y entrada
        APP->>DB: editar_proyecto(datos, versionEsperada)
        DB->>DB: Validar y actualizar bajo bloqueo con control de versión
        DB-->>APP: Nueva versión o CONFLICTO
        APP-->>UI: Resultado, revalidar si se confirmó
        UI-->>U: Datos guardados o solicitud de recarga
    end

    opt SF-04 — Cerrar proyecto (QA participante, abierto)
        U->>UI: Elegir cerrar y confirmar
        UI->>APP: cerrarProyectoAction con versionEsperada
        APP->>APP: Verificar identidad y autorización
        APP->>DB: cerrar_proyecto(id, versionEsperada)
        DB->>DB: Registrar cierre atómicamente y conservar datos
        DB-->>APP: Proyecto cerrado o conflicto/rechazo
        APP-->>UI: Resultado y detalle actualizado
        UI-->>U: Consulta en solo lectura tras confirmar cierre
    end

    Note over APP,DB: Cada solicitud vuelve a validar permisos. Sin sesión, acceso ajeno,<br/>proyecto cerrado o entrada inválida: error público, sin confirmar una escritura fallida.
```

SF-02 corresponde al listado/detalle inicial. No se incluye reapertura ni modificación posterior de participantes porque no están aprobadas. La selección inicial no impone mínimos nuevos de actividades o métricas.

Fuentes: [CU-01 implementado](../modulos/cu01-implementacion.md), [acciones](../../src/features/projects/actions.ts) y [consultas](../../src/features/projects/server/queries.ts).
