# Plan para cerrar el diseño técnico y preparar el repositorio

**Estado:** stack y monolito modular **APROBADOS** (`stack-aprobado.md`). El diseño detallado, base de datos y bootstrap **PENDIENTES**.

## Entregables antes de implementación paralela

1. **Diagrama de componentes:** límites entre interfaz, operaciones de servidor, módulos de dominio y Supabase; datos compartidos con salud/reportes.
2. **Diseño de seguridad:** autenticación, comprobación de rol/membresía, RLS para tablas y Storage privado. Incluir pruebas con dos proyectos y usuarios distintos (RNF-01 a RNF-03).
3. **Modelo de datos:** entidades, claves, unicidades, fechas, historiales, estados, relaciones y restricciones del archivo `../datos/invariantes-de-modelado.md`.
4. **Transacciones y archivos:** garantizar correcciones auditables; resolver fallos intermedios de guardar resultado/metadata/PDF sin dejar registros incompletos (RNF-09).
5. **Contratos compartidos:** tipos y funciones del servidor para permisos, actividades, métricas y consulta reutilizable de salud/reportes; no fijar el algoritmo pendiente.
6. **Estructura de repositorio:** revisar `estructura-repo-propuesta.md`, responsabilidades por módulos y reglas de migraciones.
7. **Bootstrap verificable:** instalar dependencias del stack aprobado, `.env.example` sin secretos, esquema/seed inicial, lint, prueba mínima, CI y README con pasos *realmente probados*.

## Secuencia de aprobación

- **Diseño:** Codex presenta ER, esquema de permisos, diagramas y contratos; Fer/Emi revisan antes de crear las migraciones y la estructura definitiva.
- **Implementación base:** una vez aprobados, Codex crea el esqueleto ejecutable con migraciones versionadas y controles mínimos.
- **Paralelo:** iniciar tareas por módulo cuando la base de autenticación, migraciones y contratos esté validada.

## No bloquear sin motivo

La fórmula de salud sigue pendiente, pero pueden definirse indicadores, consultas, estructura visual y reporte sin asignar una calificación inventada. Catálogos provisionales pueden poblarse con semillas modificables; no tratarlos como valores finales.

Referencias: `stack-aprobado.md`, `../requisitos/trazabilidad.md`, `../decisiones/pendientes.md` y CU afectados.
