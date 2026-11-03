# Secuencia CU-02 — Gestionar métricas de calidad

QA participante gestiona métricas de proyectos abiertos. Miembro del equipo y participantes de proyectos cerrados consultan. El valor persistido y su cumplimiento proceden de la BD; la vista previa no sustituye el cálculo confiable.

```mermaid
sequenceDiagram
    autonumber
    actor U as QA / Miembro del equipo
    participant UI as Interfaz de métricas
    participant APP as Next.js / Métricas
    participant AUTH as Supabase Auth
    participant DB as PostgreSQL / RLS / RPC

    U->>UI: Abrir Métricas del proyecto
    UI->>APP: Solicitar métricas e historial
    APP->>AUTH: Verificar identidad
    AUTH-->>APP: Identidad verificada
    APP->>DB: Verificar participación y leer configuración
    APP->>DB: consultar_metrica por cada métrica configurada
    DB-->>APP: Objetivos, valor vigente y cumplimiento
    APP-->>UI: Datos reales, sin medición no equivale a cero
    opt Consultar historial o correcciones
        U->>UI: Abrir detalle / cargar otra página
        UI->>APP: Solicitar mediciones o revisiones con cursor
        APP->>DB: Lectura paginada con RLS
        DB-->>APP: Página en orden de vigencia / revisión
        APP-->>UI: Historial y siguiente cursor
    end

    opt SF-05 — Agregar tipo de métrica (QA, abierto)
        U->>UI: Seleccionar tipo de catálogo y objetivos
        UI->>APP: agregarMetricaAction
        APP->>APP: Validar QA, participación, apertura y objetivos por tipo
        APP->>DB: agregar_metrica
        DB->>DB: Validar catálogo y unicidad por proyecto y tipo
        DB-->>APP: Métrica Sin medición o rechazo por duplicado
        APP-->>UI: Resultado y revalidación tras confirmar
    end

    opt SF-02 — Registrar medición (QA, abierto)
        U->>UI: Capturar fecha y datos fuente
        UI->>APP: registrarMedicionAction con medicionId estable
        APP->>APP: Validar fuentes, no aceptar valor calculado como autoridad
        APP->>DB: registrar_medicion(id, fecha, datos_fuente)
        DB->>DB: Reautorizar y calcular según tipo de métrica
        DB->>DB: Transacción: medición y revisión inicial, o reutilizar alta idéntica
        DB-->>APP: Revisión, valor y métrica actualizada
        APP-->>UI: Confirmar y recargar historial
        Note over UI,DB: Un reintento idéntico no duplica. La vigencia depende de fecha y orden,<br/>no del momento en que se corrigió un registro antiguo.
    end

    opt SF-03 — Cambiar objetivo (QA, abierto)
        U->>UI: Editar objetivo general y crítico cuando aplica
        UI->>APP: configurarObjetivoAction con configuradaEn esperada
        APP->>DB: configurar_objetivo con token exacto y objetivos validados
        DB->>DB: Reautorizar, comparar token y reevaluar cumplimiento
        DB-->>APP: Métrica actualizada o CONFLICTO
        APP-->>UI: Confirmación o indicación de recarga
    end

    opt SF-04 — Corregir medición (QA, abierto)
        U->>UI: Corregir datos fuente de una medición
        UI->>APP: corregirMedicionAction con revisionEsperada
        APP->>APP: Verificar permisos y validar datos fuente
        APP->>DB: corregir_medicion
        DB->>DB: Anexar nueva revisión bajo control de concurrencia
        DB-->>APP: Revisión nueva, original, autor y fechas conservados
        APP-->>UI: Valor / cumplimiento y trazabilidad actualizados
    end
    Note over APP,DB: Todas las mutaciones validan rol, proyecto abierto y entrada en servidor y RPC.<br/>Las versiones o tokens obsoletos producen conflicto sin sobrescribir.
```

SF-01 es la consulta de valor actual e historial. Una medición con denominador cero puede ser No evaluable: no se inventa un cero. Estos cálculos de métricas aprobadas no definen el algoritmo de salud pendiente.

Fuentes: [CU-02 implementado](../modulos/cu02-implementacion.md), [acciones](../../src/features/metrics/actions.ts) y [consultas](../../src/features/metrics/server/queries.ts).
