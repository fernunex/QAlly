# CU-05 — Implementación y validación local

**Fecha: 2026-10-20. Estado: consulta implementada y validada localmente; algoritmo y clasificación de salud siguen PENDIENTES.** Rama `feat/cu05-salud-proyecto` desde `dev`. Fuente de alcance: [CU-05](../requisitos/casos-uso/CU-05.md), RF-26 a RF-29 y RF-33, RNF-01/02/03/04/07, [contratos v1 §6](../arquitectura/contratos-v1.md) y [ADR-002](../decisiones/ADR-002-cierre-diseno-v1.md). Sin migraciones ni cambios de RLS, contratos, reglas de negocio o requisitos.

## Uso local

Misma preparación que [CU-01](cu01-implementacion.md#uso-local). Abrir un proyecto y la pestaña **Salud** (`/proyectos/{proyectoId}/salud`), disponible para QA y Miembro del equipo participantes, también con el proyecto cerrado. La vista es de solo lectura.

## Realización técnica

- `src/features/health/server/queries.ts`: `consultarResumen(proyectoId: string): Promise<ResumenProyecto>`. Llama a la RPC `consultar_resumen` con la sesión del usuario (sin credencial de servicio); la RPC exige participación y obtiene en una sola lectura consistente proyecto, conteos, actividades resumidas y métricas con `private.metrica_json`. Identificador malformado, proyecto inexistente o ajeno → `ErrorOperacion("NO_DISPONIBLE")`. El contrato `consultarResumen(contexto, {proyectoId})` se realiza como en los demás adaptadores: el contexto es la sesión del servidor.
- `src/features/health/types.ts`: DTO exportado y JSON serializable, pensado para que **CU-06 lo reutilice sin volver a consultar**: `ResumenProyecto { proyecto: ProyectoResumen; generadoEn; salud: EstadoSalud; etapas: EtapaResumen[]; metricas: MetricaProyecto[] }`, `EtapaResumen { codigo; nombre; conteos; actividades: ActividadEtapaResumen[]; salud }` y `ActividadEtapaResumen { id; tipoCodigo; tipoNombre; responsableNombre; estado }`. Las métricas reutilizan `MetricaProyecto` de CU-02.
- `src/features/health/dto.ts`: `resumenDTO(raw)` valida con Zod la respuesta. Exige las tres etapas en el orden fijo (requisitos, diseño, desarrollo), conteos enteros no negativos, estados de actividad conocidos y salud **literal** `{estado: "Sin evaluar", motivo: "Algoritmo pendiente"}`: si la BD devolviera otra clasificación sin algoritmo aprobado, el resumen se rechaza. Campos extra (p. ej. un puntaje) se descartan. Métricas mediante `metricaDTO` de CU-02 («Sin medición» distinta de cero y de No evaluable).
- `src/features/health/lib.ts`: utilidades puras que solo agrupan datos ya entregados por la BD: `conteoGeneral` (suma de conteos de las tres etapas), `metricasDeEtapa`, `contarCumplimiento`, `resumenCumplimiento` y `objetivoTexto`. No calculan salud, porcentajes, pesos ni categorías.
- `src/features/health/components/salud-proyecto.tsx`: el prototipo se conecta al resumen real y deja de importar `src/lib/mock`. Muestra la fecha de la lectura; salud general y por etapa como «Sin evaluar» con su motivo; conteos Pendiente/En progreso/En revisión/Aprobada generales y por etapa; resumen de cumplimiento de métricas (distinto de salud); actividades de cada etapa en un desplegable con responsable y estado (SF-02) y enlace al tablero filtrado; tarjetas de métricas con valor actual, crítico de M-01, objetivo, cumplimiento, estado de medición con causa y fecha (SF-01), con enlace al historial de Métricas.
- `src/app/(app)/proyectos/[proyectoId]/salud/page.tsx` y `error.tsx`: NO_DISPONIBLE muestra el estado sin acceso con «Volver al listado» sin revelar datos (FE-02); cualquier otro fallo de carga cae en el límite de error del segmento con «Reintentar» (`retry` de Next 16, vuelve a consultar en el servidor) y no se muestran datos parciales (FE-03). Proyecto cerrado: aviso de solo lectura y mismos datos.
- `proyecto-tabs.tsx`: nueva pestaña **Salud** tras «Información general», visible para ambos roles.

### Reglas respetadas

- Sin algoritmo, pesos, rangos, puntajes ni categorías Malo/Regular/Bueno/Excelente; las actividades pendientes no se interpretan como mala salud.
- Métrica sin medición: «Sin medición», nunca 0. Medición con denominador cero: «No disponible» y No evaluable con su causa.
- Valor actual, cumplimiento y conteos provienen de la BD; la aplicación no los recalcula.

## Pruebas reproducibles

```sh
npm run unit:test
npm run db:lint
npm run db:test
npm run typecheck
npm run lint
npm run build
npm run e2e:test   # o: npx playwright test tests/e2e/cu05.spec.ts
```

Requisitos de E2E iguales a CU-01. Cada escenario crea proyectos aislados por RPC; no borra datos existentes.

## Resultado comprobado

- **54 pruebas unitarias aprobadas** (4 nuevas en `tests/unit/salud.test.ts`): mapeo de proyecto, tres etapas en orden y salud Sin evaluar; serialización JSON íntegra; Sin medición/No evaluable/valor vigente; conteo general y cumplimiento; rechazo de clasificaciones no aprobadas, etapas incompletas o desordenadas, conteos negativos, estados desconocidos y métricas fuera del catálogo.
- **20 pruebas de integración de BD aprobadas** sin cambios en migraciones (incluye la existente de resumen consistente y el rechazo NO_DISPONIBLE de la RPC); SQL lint sin errores.
- **50 escenarios E2E aprobados** en la suite completa (6 de CU-05: 3 por navegador, más los 44 de CU-01 a CU-04 sin regresión) con Chromium y Firefox de Playwright 1.64.1 (builds 1248 y 1555), Linux x86_64. Suite completa: 3,9 min; no son tiempos RNF.
- Se verifica: QA navega a la pestaña Salud; salud general y de cada etapa Sin evaluar con motivo; tres etapas en orden fijo con conteos de los cuatro estados; actividades por etapa con responsable o «Sin responsable» y estado; métrica medida con valor, objetivo, cumplimiento, estado y fecha; métricas sin medición como «Sin medición (no equivale a 0)»; ausencia de categorías y porcentajes de salud; sin acciones de gestión; Miembro participante consulta la misma vista sin pestaña de Reportes; proyecto sin datos con las tres etapas vacías; QA ajeno, Miembro no participante, proyecto inexistente e identificador malformado ven «Este proyecto no está disponible» y vuelven al listado; sin sesión redirige al login; medición No evaluable y proyecto cerrado consultable por QA y Miembro.
- Lint, generación de rutas, TypeScript y build aprobados.

**Límites de esta ejecución:** FE-03 (error de carga con reintento) se cubre por revisión y por el rechazo unitario de respuestas inválidas, no con un E2E: no hay forma de provocar el fallo de la RPC desde el navegador sin alterar la BD. Node local 26.11.1 (package.json declara 24). Supabase local sobre Podman 6.1.3 con socket compatible (`DOCKER_HOST`) y alias temporal `docker → podman`, iniciado con la CLI y `--network-id qally-local`, como en [CU-03](cu03-implementacion.md); con Podman los puertos quedan publicados en `0.0.0.0`. No se probó con Chrome estable instalado ni en GitHub Actions. Con el dataset grande, cada etapa lista todas sus actividades (dentro de un desplegable cerrado); RNF-04 sigue pendiente de medición en entorno desplegado. No se hizo push ni despliegue.

## Pendiente

- **Algoritmo de salud** (RF-26 y clasificación final de RF-27): pesos, categorías, rangos, datos ausentes y actividades pendientes. Al aprobarse, se calculará en la BD/resumen compartido y la validación literal de `resumenDTO` deberá ampliarse con la decisión registrada.
- CU-06 debe consumir `consultarResumen`/`ResumenProyecto` para que vista y reporte coincidan.

## Trazabilidad

Se conservan RF, RNF y reglas aprobadas.

| Subflujo / requisito | Implementación | Evidencia automatizada |
|---|---|---|
| RF-33; RNF-01/02/03; FE-02 | `consultar_resumen` con sesión del usuario y participación exigida en la BD; NO_DISPONIBLE indistinguible para ajeno, inexistente o malformado. | E2E QA ajeno, Miembro no participante, inexistente, malformado y sin sesión; integración BD existente. |
| Pasos 1–7; RF-28; RNF-07 | Pestaña Salud con resumen general, tres etapas en orden fijo y métricas; datos reales de la BD. | E2E QA y Miembro en Chromium y Firefox; unitarias de mapeo. |
| FA-01; RF-26/27 (parcial); RF-29 | Salud general y por etapa «Sin evaluar» con motivo; sin puntajes ni categorías; validación literal del estado. | E2E ausencia de categorías; unitarias de rechazo de clasificaciones. Algoritmo pendiente. |
| SF-01, FE-01; RF-28/29 | Tarjeta de métrica con valor actual, objetivo, cumplimiento, estado de medición y fecha; Sin medición ≠ 0. | E2E Sin medición, medida y No evaluable; unitarias de lectura. |
| SF-02; RF-28 | Conteos por los cuatro estados y lista de actividades por etapa con responsable y estado. | E2E conteos y listas por etapa. |
| FE-03; RNF-04 | Límite de error del segmento con reintento; sin datos parciales. | Revisión y unitarias de respuesta inválida; sin E2E. RNF-04 pendiente en despliegue. |
| Regla de proyectos cerrados | Consulta permitida con aviso de solo lectura. | E2E proyecto cerrado como QA y Miembro. |
