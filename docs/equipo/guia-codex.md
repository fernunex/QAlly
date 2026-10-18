# Guía breve para trabajar con Codex en el repositorio

**No forma parte del README público.** Cada agente debe seguir `AGENTS.md` y cargar solo el contexto necesario para su tarea.

## Onboarding inicial (una sola vez por integrante)

1. Abrir el repositorio en Codex. Revisar `AGENTS.md` y localizar documentación con `docs/indice.md`.
2. Ver el [stack aprobado](../arquitectura/stack-aprobado.md) cuando la tarea afecte tecnologías, dependencias o infraestructura.
3. Elegir un módulo de `docs/modulos/`; leer su CU y los requisitos indicados, no el archivo maestro histórico.
4. Si la tarea toca el esquema, permisos o contratos, revisar también `../datos/invariantes-de-modelado.md` y las decisiones pertinentes.
5. Toda propuesta nueva debe identificar **APROBADO**, **PRELIMINAR** y **PENDIENTE** y no sobrescribir decisiones vigentes.

## Prompts de arranque por tarea

**Arquitectura y base de datos (Fer / Emi):**
> Lee AGENTS.md, docs/arquitectura/stack-aprobado.md, docs/arquitectura/plan-de-diseno.md y docs/datos/invariantes-de-modelado.md. El stack y el monolito modular ya están aprobados: no los rediseñes sin razón. Propón el ER, las políticas RLS, los contratos entre módulos y el plan de bootstrap. Consulta CU/RF pertinentes y distingue decisiones abiertas. No generes código hasta que revise el diseño.

**Implementación de módulo:**
> Voy a trabajar en `<modulo>`. Lee AGENTS.md, docs/modulos/<modulo>.md y el CU enlazado. Consulta solo los RF/RNF pertinentes. Utiliza el stack aprobado y presenta un plan de implementación con dependencias y pruebas antes de modificar archivos comunes.

**QA / documentación:**
> Para `<CU>`, lee su caso de uso, los RF/RNF vinculados y docs/equipo/sqa-en-el-desarrollo.md. Diseña casos de prueba medibles, evidencia y trazabilidad sin asumir decisiones pendientes.

## Actualizaciones

- Cambios de producto → CU/RF/RNF/catálogos afectados + decisiones. Cambios de arquitectura → documentos de arquitectura, datos y registro de decisiones.
- Si un agente distinto a Codex no reconoce `AGENTS.md` automáticamente, incluir explícitamente su lectura en el primer prompt.
- No subir secretos; no hacer `push` ni desplegar sin autorización y respetar revisión por PR.

## Uso de tokens

La documentación en el repositorio no se envía entera al modelo solo por existir. El ahorro proviene de leer únicamente los archivos necesarios, mantener `AGENTS.md` corto y no pegar el contexto maestro de 75 KB en cada sesión.
