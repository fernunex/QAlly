# ADR-003 — Integración técnica de salud (DEC-27) y contenido del reporte (DEC-28)

**Estado: APROBADO para implementación, 2026-11-02**, por encargo del equipo («refactor de diseño y de implementación con los nuevos cambios») y decisiones DEC-29/30/31 del mismo día. Cierra las brechas BR-01 a BR-07 de [pendientes y brechas](../requisitos/pendientes-y-brechas.md). Conserva ADR-001/002 en lo no mencionado: stack, monolito modular, RLS, captura cifrada de 15 minutos, límites de 1/2/3 MiB y ausencia de histórico de PDFs.

## Contexto

DEC-25–28 (2026-10-30) aprobaron la fórmula de salud, su clasificación, el contenido del reporte, la preselección de diez actividades, la fuente opcional de mediciones y la separación del criterio crítico de M-01. El código seguía el modelo anterior: `consultar_resumen` devolvía el literal «Sin evaluar / Algoritmo pendiente» y el DTO rechazaba cualquier otro valor. Quedaban abiertas RQ-01 (meta porcentual 0), RQ-02 (nulos técnicos) y RQ-03 (objetivos históricos).

## Decisión

### 1. La salud se calcula en PostgreSQL, en la misma lectura del resumen

`private.salud_json(proyecto, etapa)` aplica `S = 100 × (A + Σ C_i) / (N_A + N_M)` al proyecto completo (etapa NULL) y a cada etapa por separado; nunca promedia etapas. `public.consultar_resumen` lo incluye en la salud general y en cada etapa. Dashboard (CU-05), vista del reporte y PDF (CU-06) consumen ese único resultado: la captura cifrada lo guarda tal cual y el PDF no recalcula.

**Motivo:** la BD ya era la fuente del valor y del cumplimiento de cada métrica (ADR-002, «no se recalcula en la interfaz»); calcular allí evita dos implementaciones y permite aritmética decimal exacta con los conteos originales.

**Precisión:** cada aporte `C_i` se calcula con los conteos de `datos_fuente` (no con el valor redondeado a 8 decimales) y 40 decimales; S se redondea a 20 decimales para clasificar y a 2 para mostrar. Así 89.999 % se muestra «90.00 %» y se clasifica Bueno, como exige CU-05. Los bordes exactos (p. ej. 2/3 + 1/3) no caen por error de redondeo.

### 2. Forma del resultado (sustituye `{estado, motivo}` de contratos v1 §6)

```ts
EstadoSalud = {
  estado: "Evaluada" | "Sin evaluar";
  porcentaje: string | null;        // S redondeado a 2 decimales; null si Sin evaluar
  clasificacion: "Malo" | "Regular" | "Bueno" | "Excelente" | null;
  puntos: string;                   // A + Σ C_i
  posibles: number;                 // N_A + N_M
  actividades: { total; aprobadas };
  metricas: { total; sinDatos };
  advertencias: ("SIN_ELEMENTOS" | "EVALUACION_PARCIAL" | "SIN_AVANCE" | "DEFECTOS_GRAVES")[];
}
```

- `SIN_ELEMENTOS`: N_A + N_M = 0 → «Sin evaluar», sin dividir entre cero.
- `EVALUACION_PARCIAL`: alguna métrica Sin medición o No evaluable (aporta 0 y sigue en N_M).
- `SIN_AVANCE`: hay elementos, pero ninguna actividad Aprobada ni métrica con aporte → 0 % evaluado, distinto de Sin evaluar.
- `DEFECTOS_GRAVES`: la medición vigente de M-04 es > 0; no limita puntuación ni clasificación.

Los textos se redactan en la interfaz (`src/features/health/lib.ts`), igual en vista y PDF.

### 3. Métrica (contratos v1 §4)

`private.metrica_json` agrega `aporte` (C_i con 8 decimales, solo para mostrar; null = no aporta por falta de datos) y `cumplimientoCritico` (solo M-01). El `cumplimiento` de M-01 usa solo el valor general (DEC-26); el criterio de pruebas críticas se informa aparte y no afecta salud. El campo `objetivo_critico` se conserva.

### 4. Resumen de actividades (DEC-28)

Cada actividad del resumen agrega `instancia` (número del tipo en el proyecto por orden de creación) y `evidencias` del **último intento enviado**: `{id, tipo: "PDF", nombre}` o `{id, tipo: "Enlace", url}`. El PDF de evidencia no se incrusta; la vista y el PDF del reporte enlazan `/api/evidencias/{id}/archivo`, que vuelve a exigir sesión y participación.

### 5. Salud en listado y encabezado

`public.consultar_salud(uuid[])` (máx. 100) devuelve la salud general de los proyectos autorizados, usando la misma `private.salud_json`. Los no autorizados se omiten sin revelar si existen.

### 6. Decisiones de requisitos residuales

- **DEC-29 (RQ-01):** objetivos porcentuales de M-01/02/03 en (0,100] en formulario, Zod y `private.validar_objetivo`. Una meta 0 % previa a esta migración no se reescribe: cuenta como No evaluable para salud (aporta 0, evaluación parcial). El objetivo crítico de M-01 sigue admitiendo 0 porque no participa en salud.
- **DEC-30 (RQ-02):** un nulo técnico en una revisión Evaluable o en su objetivo (imposible por las restricciones CHECK del esquema) es un error de integridad: la BD falla y el DTO rechaza un resumen incoherente; la vista muestra FE-03 con reintento, nunca cifras dudosas. El DTO también verifica que N_A, A y N_M coincidan con las actividades y métricas del mismo resumen.
- **DEC-31 (RQ-03):** el aporte usa el objetivo **vigente**; no se agrega historial de objetivos. El reporte sigue siendo del estado actual.

### 7. Catálogos (DEC-25/26)

La migración actualiza los nombres ratificados y marca las diez actividades como preseleccionadas. El objetivo de cada actividad se mantiene en el catálogo de código (`src/lib/catalogs.ts`), sin columna nueva. `fuente_referencia` es opcional en `private.calcular`; si se envía, 1–2048 caracteres.

## Alternativas descartadas

- **Calcular en TypeScript con fracciones `BigInt`:** facilita pruebas unitarias, pero duplica la fuente de verdad que ADR-002 dejó en la BD y exige exponer numeradores/denominadores en el DTO.
- **Calcular con el `valor` ya redondeado a 8 decimales:** podía mover resultados en los bordes 50/70/90.
- **Clasificar en la interfaz con `Number`:** 69.99999999999999999 se convierte en 70 y clasifica mal.
- **Tabla de historial de objetivos (RQ-03):** ningún RF la pide y añade esquema.

## Consecuencias

- Migración `supabase/migrations/20261102000100_dec25_28_salud_reportes.sql` (solo funciones y datos de referencia; sin tablas ni columnas nuevas).
- Contratos v1 §4 y §6 quedan ampliados por este ADR; las capturas de reporte emitidas antes de desplegar dejan de verificarse por forma (deben regenerarse; vencen en 15 minutos de todos modos).
- Pruebas: `tests/database/salud.test.mjs` (fórmula y bordes contra la BD), `tests/unit/salud.test.ts` y `reportes.test.ts`, E2E por técnica de revisión en [plan de pruebas](../equipo/plan-pruebas-dec25-28.md).
