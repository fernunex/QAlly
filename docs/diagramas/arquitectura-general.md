# Arquitectura general de QAlly

Vista de la implementación actual. Next.js agrupa interfaz y operaciones de servidor en un monolito modular. Supabase local aporta identidad, datos y archivos privados; Vercel y Supabase Cloud son destinos aprobados todavía sin configurar.

```mermaid
flowchart TB
    QA["QA"]
    MI["Miembro del equipo"]
    NAV["Navegador web<br/>Chrome / Firefox"]
    QA --> NAV
    MI --> NAV

    subgraph QALLY["QAlly — una aplicación Next.js + React + TypeScript"]
        UI["Interfaz React<br/>Proyectos, métricas, tablero y Mis actividades"]
        EN["Entradas de servidor<br/>Server Components, Server Actions y Route Handlers"]
        SEG["Sesión SSR y autorización<br/>Identidad, rol, participación y estado del proyecto"]
        PRO["CU-01<br/>Gestión de proyectos"]
        MET["CU-02<br/>Métricas y mediciones"]
        ACT["CU-03<br/>Actividades SQA y revisión QA"]
        EVI["CU-04<br/>Entregas y evidencias"]
        DAT["Consultas y RPC<br/>Supabase JS con sesión del usuario"]
        PDF["Adaptador de PDF solo servidor<br/>Validación, reserva, transferencia y confirmación"]
        UI -->|"Solicitudes de lectura y escritura"| EN
        EN --> SEG
        SEG --> PRO
        SEG --> MET
        SEG --> ACT
        SEG --> EVI
        PRO --> DAT
        MET --> DAT
        ACT --> DAT
        EVI --> DAT
        EVI -->|"Subida autorizada"| PDF
    end

    subgraph SUPA["Supabase — servicios locales de desarrollo"]
        AUTH["Auth<br/>Credenciales y sesiones"]
        DB[("PostgreSQL<br/>Datos relacionales, RLS, restricciones y RPC transaccionales")]
        ST[("Storage privado<br/>PDF de evidencia")]
    end
    NAV -->|"HTTP local; HTTPS al desplegar"| UI
    SEG -->|"Validar / renovar identidad"| AUTH
    DAT -->|"API de datos y RPC; aplica RLS"| DB
    DAT -->|"Descarga de PDF con identidad del usuario"| ST
    PDF -->|"RPC técnicas; actor verificado"| DB
    PDF -->|"Subida sin sobrescritura; credencial solo de servidor"| ST

    FUT["PENDIENTE<br/>CU-05 salud y CU-06 reportes"]
    DEP["Despliegue previsto<br/>Next.js en Vercel + Supabase Cloud"]
    EN -.->|"Componentes conservados para desarrollo posterior"| FUT
    QALLY -.->|"Aún no desplegado"| DEP
    classDef pendiente fill:#f3f4f6,stroke:#6b7280,stroke-dasharray:5 5,color:#374151;
    class FUT,DEP pendiente;
```

Las flechas internas representan llamadas dentro de la aplicación. La selección inicial de métricas y actividades de CU-01 se confirma mediante una única RPC de alta, sin desplegar módulos como servicios independientes. La autorización de cada acción/handler complementa RLS; ocultar controles no concede ni restringe por sí solo el acceso.

La descarga pasa por Next.js y usa la sesión ordinaria; la subida usa el adaptador privilegiado después de verificar permisos y contenido. Las claves privilegiadas no llegan al navegador. Un enlace de evidencia se guarda como URL validada, sin descargar su destino. La transferencia de un PDF y su confirmación en BD son pasos distintos, con reserva y compensación, no una transacción que abarque la red.

Fuentes: [C2](../arquitectura/C4-02-contenedores.md), [C3](../arquitectura/C4-03-componentes.md) y [guía de integración](../equipo/integracion-cu02-cu03-cu04.md).
