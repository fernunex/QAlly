// DEC-27/28 y DEC-29..31 contra la BD local: el cálculo de salud vive en SQL (ADR-003), así que
// los casos límite de la fórmula se prueban aquí y no con dobles de la interfaz.
// Escenarios de docs/requisitos/pendientes-y-brechas.md, «Validación pendiente».
import { beforeAll, describe, expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { provisionUsers, checked, rpc } from '../../scripts/lib/local.mjs';

let qa, member, tiposA, tiposM;
const A = (c) => tiposA.find((t) => t.codigo === c).id;
const M = (c) => tiposM.find((t) => t.codigo === c).id;
const rejected = async (promise, code) => { const r = await promise; expect(r.error, JSON.stringify(r.data)).toBeTruthy(); if (code) expect(r.error.message).toContain(code); };

beforeAll(async () => {
  [qa, , member] = await provisionUsers();
  tiposA = checked(await qa.client.from('tipo_actividad').select('id,codigo').order('codigo'));
  tiposM = checked(await qa.client.from('tipo_metrica').select('id,codigo').order('codigo'));
});

/** Proyecto aislado con las actividades (códigos, repetibles) y métricas {codigo: objetivo}. */
async function proyecto(actividades = [], metricas = {}) {
  const p = await rpc(qa.client, 'crear_proyecto', {
    p_solicitud_id: randomUUID(), p_nombre: `Salud ${randomUUID()}`, p_descripcion: 'DEC-27', p_fecha_inicio: '2026-10-01',
    p_miembros_ids: [member.id],
    p_metricas: Object.entries(metricas).map(([c, objetivo]) => ({ tipoId: M(c), objetivo, ...(c === 'M-01' ? { objetivoCritico: '100' } : {}) })),
  });
  const ids = [];
  for (const c of actividades) ids.push((await rpc(qa.client, 'agregar_actividad', { p_proyecto_id: p.id, p_tipo_id: A(c), p_descripcion: `Instancia ${c}` })).id);
  return { id: p.id, actividades: ids };
}
/** Lleva una actividad hasta Aprobada (o En revisión) con un enlace como evidencia. */
async function avanzar(actividadId, hasta = 'Aprobada', url = 'https://example.test/evidencia') {
  let a = checked(await qa.client.from('actividad_sqa').select('id,version:version::text').eq('id', actividadId).single());
  a = await rpc(qa.client, 'asignar_responsable', { p_actividad_id: a.id, p_responsable_id: member.id, p_version_esperada: a.version });
  a = await rpc(member.client, 'iniciar_actividad', { p_actividad_id: a.id, p_version_esperada: a.version });
  const e = await rpc(member.client, 'preparar_entrega', { p_actividad_id: a.id, p_version_esperada: a.version });
  a = await rpc(member.client, 'guardar_resultado', { p_entrega_id: e.id, p_resultado: 'Resultado', p_version_esperada: e.version });
  a = await rpc(member.client, 'agregar_enlace', { p_entrega_id: e.id, p_url: url, p_version_esperada: a.version });
  a = await rpc(member.client, 'enviar_entrega', { p_entrega_id: e.id, p_version_esperada: a.version });
  if (hasta === 'Aprobada') await rpc(qa.client, 'revisar_entrega', { p_entrega_id: e.id, p_decision: 'Aprobar', p_version_esperada: a.version });
}
async function medir(pid, codigo, datos, fecha = '2026-10-10') {
  const m = checked(await qa.client.from('metrica_proyecto').select('id').eq('proyecto_id', pid).eq('tipo_metrica_id', M(codigo)).single());
  return rpc(qa.client, 'registrar_medicion', { p_medicion_id: randomUUID(), p_metrica_proyecto_id: m.id, p_medida_en: `${fecha}T00:00:00Z`, p_datos_fuente: datos });
}
const resumen = (pid) => rpc(qa.client, 'consultar_resumen', { p_proyecto_id: pid });
const etapa = (r, codigo) => r.etapas.find((e) => e.codigo === codigo).salud;
const metrica = (r, codigo) => r.metricas.find((m) => m.tipo.codigo === codigo);
/** Salud general de un proyecto con una sola métrica M-02 (objetivo 100) y n/d medidos. */
async function soloM02(n, d) {
  const p = await proyecto([], { 'M-02': '100' });
  await medir(p.id, 'M-02', { integrados_revisados: n, integrados: d });
  return (await resumen(p.id)).salud;
}

describe('Salud DEC-27: fórmula y ejemplo de aceptación', () => {
  test('5 actividades, 3 Aprobadas y aportes 1 y 0.8 → 68.57 %, Regular', async () => {
    const p = await proyecto(['A-05', 'A-06', 'A-08', 'A-09', 'A-10'], { 'M-02': '100', 'M-03': '100' });
    for (const id of p.actividades.slice(0, 3)) await avanzar(id);
    await medir(p.id, 'M-02', { integrados_revisados: 10, integrados: 10 });
    await medir(p.id, 'M-03', { requisitos_probados: 8, requisitos_definidos: 10 });
    const r = await resumen(p.id);
    expect(r.salud).toEqual({ estado: 'Evaluada', porcentaje: '68.57', clasificacion: 'Regular', puntos: '4.8', posibles: 7, actividades: { total: 5, aprobadas: 3 }, metricas: { total: 2, sinDatos: 0 }, advertencias: [] });
    expect(metrica(r, 'M-02').aporte).toBe('1.00000000');
    expect(metrica(r, 'M-03').aporte).toBe('0.80000000');
    // Las cuatro métricas son de Desarrollo: la etapa coincide con la general aquí.
    expect(etapa(r, 'desarrollo').porcentaje).toBe('68.57');
  });

  test('solo Aprobada aporta; En revisión aporta 0 y cada instancia repetida pesa 1', async () => {
    const p = await proyecto(['A-09', 'A-09', 'A-09', 'A-09']);
    await avanzar(p.actividades[0]);
    await avanzar(p.actividades[1], 'En revisión');
    const r = await resumen(p.id);
    expect(r.salud).toMatchObject({ porcentaje: '25.00', clasificacion: 'Malo', posibles: 4, actividades: { total: 4, aprobadas: 1 } });
    expect(r.etapas.find((e) => e.codigo === 'desarrollo').actividades.map((a) => a.instancia)).toEqual([1, 2, 3, 4]);
  });

  test('general se calcula con todos los elementos, no promediando etapas', async () => {
    const p = await proyecto(['A-01', 'A-05', 'A-06', 'A-09']);
    await avanzar(p.actividades[0]);
    const r = await resumen(p.id);
    expect(etapa(r, 'requerimientos').porcentaje).toBe('100.00');
    expect(etapa(r, 'desarrollo').porcentaje).toBe('0.00');
    // Promedio de etapas evaluadas sería 50 %; la general es 1/4.
    expect(r.salud.porcentaje).toBe('25.00');
  });
});

describe('Salud DEC-27: aportes por métrica', () => {
  test('tasas bajo, igual y sobre el objetivo; tope de 1', async () => {
    const p = await proyecto([], { 'M-01': '90', 'M-02': '80', 'M-03': '50' });
    await medir(p.id, 'M-01', { aprobadas: 45, ejecutadas: 100, criticas_aprobadas: 0, criticas_ejecutadas: 0 });
    await medir(p.id, 'M-02', { integrados_revisados: 8, integrados: 10 });
    await medir(p.id, 'M-03', { requisitos_probados: 10, requisitos_definidos: 10 });
    const r = await resumen(p.id);
    expect(metrica(r, 'M-01').aporte).toBe('0.50000000');
    expect(metrica(r, 'M-02').aporte).toBe('1.00000000');
    expect(metrica(r, 'M-03').aporte).toBe('1.00000000');
    expect(r.salud.porcentaje).toBe('83.33');
  });

  test('M-04 objetivo 0: 0 defectos aporta 1; uno o más aporta 0 y advierte sin tope', async () => {
    const p = await proyecto(['A-09'], { 'M-04': '0' });
    await avanzar(p.actividades[0]);
    await medir(p.id, 'M-04', { criticos_abiertos: 0, altos_abiertos: 0 }, '2026-10-01');
    let r = await resumen(p.id);
    expect(metrica(r, 'M-04').aporte).toBe('1.00000000');
    expect(r.salud).toMatchObject({ porcentaje: '100.00', clasificacion: 'Excelente', advertencias: [] });
    await medir(p.id, 'M-04', { criticos_abiertos: 1, altos_abiertos: 0 }, '2026-10-02');
    r = await resumen(p.id);
    expect(metrica(r, 'M-04').aporte).toBe('0.00000000');
    expect(r.salud).toMatchObject({ porcentaje: '50.00', clasificacion: 'Regular', advertencias: ['DEFECTOS_GRAVES'] });
    expect(etapa(r, 'desarrollo').advertencias).toContain('DEFECTOS_GRAVES');
  });

  test('M-04 objetivo positivo: menor e igual aportan 1; mayor aporta objetivo/valor', async () => {
    const p = await proyecto([], { 'M-04': '2' });
    for (const [n, aporte] of [[1, '1.00000000'], [2, '1.00000000'], [8, '0.25000000']]) {
      await medir(p.id, 'M-04', { criticos_abiertos: n, altos_abiertos: 0 }, `2026-10-1${n}`);
      expect(metrica(await resumen(p.id), 'M-04').aporte).toBe(aporte);
    }
  });

  test('Excelente con defectos graves abiertos conserva clasificación y advierte', async () => {
    const p = await proyecto(Array(19).fill('A-09'), { 'M-04': '0' });
    for (const id of p.actividades) await avanzar(id);
    await medir(p.id, 'M-04', { criticos_abiertos: 0, altos_abiertos: 3 });
    expect((await resumen(p.id)).salud).toMatchObject({ porcentaje: '95.00', clasificacion: 'Excelente', advertencias: ['DEFECTOS_GRAVES'] });
  });

  test('M-01 usa solo el valor general; el criterio crítico fallido no cambia aporte ni cumplimiento', async () => {
    const p = await proyecto([], { 'M-01': '90' });
    await medir(p.id, 'M-01', { aprobadas: 95, ejecutadas: 100, criticas_aprobadas: 5, criticas_ejecutadas: 10 });
    const m = metrica(await resumen(p.id), 'M-01');
    expect(m).toMatchObject({ cumplimiento: 'Cumple', cumplimientoCritico: 'Incumple', aporte: '1.00000000' });
  });
});

describe('Salud DEC-27: ausencias, Sin evaluar y 0 %', () => {
  test('sin elementos: Sin evaluar sin dividir entre cero; etapa vacía frente a etapa con actividades', async () => {
    const vacio = await resumen((await proyecto()).id);
    expect(vacio.salud).toMatchObject({ estado: 'Sin evaluar', porcentaje: null, clasificacion: null, posibles: 0, advertencias: ['SIN_ELEMENTOS'] });
    const p = await proyecto(['A-01']);
    const r = await resumen(p.id);
    expect(etapa(r, 'diseno')).toMatchObject({ estado: 'Sin evaluar', advertencias: ['SIN_ELEMENTOS'] });
    // Con elementos y ninguno aprobado: 0 % es una evaluación, distinta de Sin evaluar.
    expect(etapa(r, 'requerimientos')).toMatchObject({ estado: 'Evaluada', porcentaje: '0.00', clasificacion: 'Malo', advertencias: ['SIN_AVANCE'] });
  });

  test('Sin medición y No evaluable aportan 0, siguen en el denominador y marcan evaluación parcial', async () => {
    const p = await proyecto(['A-09'], { 'M-02': '100', 'M-03': '100' });
    await avanzar(p.actividades[0]);
    await medir(p.id, 'M-03', { requisitos_probados: 0, requisitos_definidos: 0 });
    const r = await resumen(p.id);
    expect(metrica(r, 'M-02')).toMatchObject({ condicionPrincipal: 'Sin medición', valorActual: null, aporte: null });
    expect(metrica(r, 'M-03')).toMatchObject({ condicionPrincipal: 'No evaluable', valorActual: null, aporte: null });
    expect(r.salud).toMatchObject({ porcentaje: '33.33', posibles: 3, metricas: { total: 2, sinDatos: 2 }, advertencias: ['EVALUACION_PARCIAL'] });
  });

  test('elementos sin aprobar ni medir: 0 % con falta de datos', async () => {
    const p = await proyecto(['A-05'], { 'M-02': '100' });
    expect((await resumen(p.id)).salud).toMatchObject({ estado: 'Evaluada', porcentaje: '0.00', advertencias: ['EVALUACION_PARCIAL', 'SIN_AVANCE'] });
  });
});

describe('Salud DEC-27: clasificación con el valor sin redondear', () => {
  test.each([
    [0, 1, '0.00', 'Malo'], [49999, 100000, '50.00', 'Malo'], [1, 2, '50.00', 'Regular'],
    [69999, 100000, '70.00', 'Regular'], [7, 10, '70.00', 'Bueno'],
    [89999, 100000, '90.00', 'Bueno'], [9, 10, '90.00', 'Excelente'], [1, 1, '100.00', 'Excelente'],
  ])('%i/%i → %s %%, %s', async (n, d, porcentaje, clasificacion) => {
    expect(await soloM02(n, d)).toMatchObject({ porcentaje, clasificacion });
  });

  test('aportes periódicos (2/3 + 1/3) suman un borde exacto sin caer por redondeo', async () => {
    const p = await proyecto(['A-09', 'A-09'], { 'M-02': '100', 'M-03': '100' });
    await avanzar(p.actividades[0]);
    await medir(p.id, 'M-02', { integrados_revisados: 2, integrados: 3 });
    await medir(p.id, 'M-03', { requisitos_probados: 1, requisitos_definidos: 3 });
    // (1 + 2/3 + 1/3) / 4 = 50 % exacto.
    expect((await resumen(p.id)).salud).toMatchObject({ porcentaje: '50.00', clasificacion: 'Regular' });
  });
});

describe('DEC-26/28/29: fuente opcional, objetivo positivo y evidencias del reporte', () => {
  test('registrar y corregir sin fuente; con fuente se conserva y vacía se rechaza', async () => {
    const p = await proyecto([], { 'M-04': '0' });
    const r = await medir(p.id, 'M-04', { criticos_abiertos: 0, altos_abiertos: 0 });
    await rpc(qa.client, 'corregir_medicion', { p_medicion_id: r.id, p_revision_esperada: 1, p_datos_fuente: { criticos_abiertos: 1, altos_abiertos: 0 } });
    await rpc(qa.client, 'corregir_medicion', { p_medicion_id: r.id, p_revision_esperada: 2, p_datos_fuente: { criticos_abiertos: 1, altos_abiertos: 0, fuente_referencia: 'https://example.test/issues' } });
    const revs = checked(await qa.client.from('revision_medicion').select('numero_revision,datos_fuente').eq('medicion_id', r.id).order('numero_revision'));
    expect(revs.map((x) => x.datos_fuente.fuente_referencia ?? null)).toEqual([null, null, 'https://example.test/issues']);
    await rejected(qa.client.rpc('corregir_medicion', { p_medicion_id: r.id, p_revision_esperada: 3, p_datos_fuente: { criticos_abiertos: 1, altos_abiertos: 0, fuente_referencia: '  ' } }), 'DATOS_INVALIDOS');
  });

  test('objetivo porcentual 0 se rechaza al agregar y configurar; M-04 y crítico 0 siguen válidos', async () => {
    const p = await proyecto();
    await rejected(qa.client.rpc('agregar_metrica', { p_proyecto_id: p.id, p_tipo_id: M('M-02'), p_objetivo: 0 }), 'DATOS_INVALIDOS');
    const m = await rpc(qa.client, 'agregar_metrica', { p_proyecto_id: p.id, p_tipo_id: M('M-01'), p_objetivo: 90, p_objetivo_critico: 0 });
    await rejected(qa.client.rpc('configurar_objetivo', { p_metrica_proyecto_id: m.id, p_configurada_en_esperada: m.configuradaEn, p_objetivo: 0, p_objetivo_critico: 100 }), 'DATOS_INVALIDOS');
    await rpc(qa.client, 'agregar_metrica', { p_proyecto_id: p.id, p_tipo_id: M('M-04'), p_objetivo: 0 });
  });

  test('el resumen referencia evidencias del último intento enviado, sin incrustarlas', async () => {
    const p = await proyecto(['A-06', 'A-06']);
    await avanzar(p.actividades[0], 'Aprobada', 'https://example.test/pr/7');
    const r = await resumen(p.id);
    const [con, sin] = r.etapas.find((e) => e.codigo === 'desarrollo').actividades;
    expect(con.evidencias).toEqual([expect.objectContaining({ tipo: 'Enlace', url: 'https://example.test/pr/7' })]);
    expect(sin.evidencias).toEqual([]);
  });

  test('consultar_salud solo devuelve proyectos autorizados', async () => {
    const p = await proyecto(['A-01']);
    const [, qa2] = await provisionUsers();
    expect(Object.keys(await rpc(qa.client, 'consultar_salud', { p_proyecto_ids: [p.id, randomUUID()] }))).toEqual([p.id]);
    expect(await rpc(qa2.client, 'consultar_salud', { p_proyecto_ids: [p.id] })).toEqual({});
  });
});
