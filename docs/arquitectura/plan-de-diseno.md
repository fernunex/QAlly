# Plan para cerrar el diseño técnico y preparar el repositorio

**Estado:** stack y monolito modular **APROBADOS** (`stack-aprobado.md`). Diseño C4 y modelo de datos documentados tras aprobación de 2026-10-18: [diseño arquitectural](diseno-arquitectural.md) y [ADR-001](../decisiones/ADR-001-diseno-tecnico-v1.md). ADR-002 cierra contratos, límites, catálogos y ajustes al esquema. SQL/código ejecutable, estructura física y bootstrap **PENDIENTES**. La aprobación actual autoriza documentación, no implementación.

## Entregables antes de implementación paralela

1. **Diagrama de componentes:** límites entre interfaz, operaciones de servidor, módulos de dominio y Supabase; datos compartidos con salud/reportes.
2. **Diseño de seguridad:** autenticación, comprobación de rol/membresía, RLS para tablas y Storage privado. Incluir pruebas con dos proyectos y usuarios distintos (RNF-01 a RNF-03).
3. **Modelo de datos:** entidades, claves, unicidades, fechas, historiales, estados, relaciones y restricciones del archivo `../datos/invariantes-de-modelado.md`.
4. **Transacciones y archivos:** garantizar correcciones auditables; resolver fallos intermedios de guardar resultado/metadata/PDF sin dejar registros incompletos (RNF-09).
5. **Contratos compartidos:** tipos y funciones del servidor para permisos, actividades, métricas y consulta reutilizable de salud/reportes; no fijar el algoritmo pendiente.
6. **Estructura de repositorio:** revisar `estructura-repo-propuesta.md`, responsabilidades por módulos y reglas de migraciones.
7. **Bootstrap verificable:** instalar dependencias del stack aprobado, `.env.example` sin secretos, esquema/seed inicial, lint, prueba mínima, CI y README con pasos *realmente probados*.

## Secuencia de aprobación

- **Diseño:** propuesta revisada y aprobada por el usuario; siete documentos generados con diagramas, datos, controles y contratos conceptuales. Cierre ADR-002 consolidado en contratos v1 y detalle técnico; salud sigue pendiente y el resto queda para implementación/configuración.
- **Implementación base:** requiere una tarea posterior autorizada; presentar el plan de bootstrap antes de instalar dependencias aprobadas y revisar SQL/contratos antes de crear la estructura definitiva.
- **Paralelo:** iniciar tareas por módulo cuando la base de autenticación, migraciones y contratos esté validada.

## No bloquear sin motivo

La fórmula de salud sigue pendiente, pero pueden definirse indicadores, consultas, estructura visual y reporte sin asignar una calificación inventada. Los catálogos v1 ya están aprobados; crear posteriormente semillas versionadas conforme a sus códigos, etapas y definiciones, sin inventar valores ni cálculos de salud.

Referencias: `stack-aprobado.md`, `../requisitos/trazabilidad.md`, `../decisiones/pendientes.md` y CU afectados.
