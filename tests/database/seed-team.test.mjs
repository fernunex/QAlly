import { afterAll, expect, test } from 'vitest';
import { randomUUID, createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { seedTeam, restoreTeamRows, teamSnapshot } from '../../scripts/seed-team.mjs';
import { clients, checked, provisionUsers, rpc } from '../../scripts/lib/local.mjs';

const temporary = mkdtempSync(join(tmpdir(), 'qally-seed-test-'));
afterAll(() => rmSync(temporary, { recursive: true, force: true }));
function isolatedSnapshot() {
 const ids = new Map();
 for (const table of ['proyecto', 'actividad_sqa', 'entrega', 'archivo_evidencia', 'evidencia',
  'revision_entrega', 'metrica_proyecto', 'medicion']) {
  for (const row of teamSnapshot.rows[table]) ids.set(row.id, randomUUID());
 }
 ids.set(teamSnapshot.rows.proyecto[0].solicitud_creacion_id, randomUUID());
 const snapshot = JSON.parse(JSON.stringify(teamSnapshot).replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, id => ids.get(id) || id));
 snapshot.rows.proyecto[0].nombre = `Prueba seed equipo ${snapshot.rows.proyecto[0].id}`;
 return snapshot;
}

test('replica el proyecto completo, conserva cambios al repetir y respeta RLS y PDF privado', async () => {
 const snapshot = isolatedSnapshot();
 const pdf = readFileSync(new URL('../../scripts/fixtures/proyecto-equipo/' + teamSnapshot.rows.archivo_evidencia[0].id + '.pdf', import.meta.url));
 const file = snapshot.rows.archivo_evidencia[0];
 writeFileSync(join(temporary, `${file.id}.pdf`), pdf);
 const options = { snapshot, filesDirectory: pathToFileURL(temporary + sep) };
 const { admin } = clients();
 const original = checked(await admin.from('proyecto').select('*').eq('id', teamSnapshot.rows.proyecto[0].id).maybeSingle());
 const result = await seedTeam(options);
 expect(result.status).toBe('created');
 const id = result.id;
 for (const table of ['actividad_sqa', 'metrica_proyecto', 'participacion_proyecto']) {
  const rows = checked(await admin.from(table).select('*').eq('proyecto_id', id));
  expect(rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))))
   .toEqual([...snapshot.rows[table]].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
 }
 for (const table of ['entrega', 'evidencia', 'revision_entrega', 'medicion']) {
  const rows = checked(await admin.from(table).select('*').in('id', snapshot.rows[table].map(r => r.id)));
  // El orden absoluto de mediciones pertenece a la secuencia de cada base.
  const normalize = list => list.map(item => { const row = { ...item }; delete row.orden_registro; return row; }).sort((a, b) => a.id.localeCompare(b.id));
  expect(normalize(rows)).toEqual(normalize(snapshot.rows[table]));
 }
 const revisions = checked(await admin.from('revision_medicion').select('*').in('medicion_id', snapshot.rows.medicion.map(m => m.id)));
 expect(revisions.sort((a,b)=>a.medicion_id.localeCompare(b.medicion_id)))
  .toEqual([...snapshot.rows.revision_medicion].sort((a,b)=>a.medicion_id.localeCompare(b.medicion_id)));
 const [qa, otherQa, member] = await provisionUsers();
 expect((await rpc(qa.client, 'consultar_resumen', { p_proyecto_id: id })).salud.actividades).toEqual({ total: 10, aprobadas: 7 });
 expect(checked(await otherQa.client.from('proyecto').select('id').eq('id', id))).toEqual([]);
 const download = checked(await member.client.storage.from('evidencias').download(file.ruta_objeto));
 expect(createHash('sha256').update(Buffer.from(await download.arrayBuffer())).digest('hex')).toBe(file.sha256);
 expect((await otherQa.client.storage.from('evidencias').download(file.ruta_objeto)).error).toBeTruthy();
 expect(checked(await admin.storage.getBucket('evidencias')).public).toBe(false);
 // Simula trabajo local posterior. Incluso el restaurador SQL protege la copia.
 checked(await admin.from('proyecto').update({ nombre: 'Cambios locales del equipo', version: 2 }).eq('id', id));
 expect((await seedTeam(options)).status).toBe('exists');
 expect(restoreTeamRows(snapshot)).toBe('exists');
 expect(checked(await admin.from('proyecto').select('nombre').eq('id', id).single()).nombre).toBe('Cambios locales del equipo');
 expect(checked(await admin.from('proyecto').select('*').eq('id', teamSnapshot.rows.proyecto[0].id).maybeSingle())).toEqual(original);
});

test('revierte toda la captura si falla una restricción al final de la importación', async () => {
 const snapshot = isolatedSnapshot();
 snapshot.rows.revision_medicion[0].numero_revision = 0;
 expect(() => restoreTeamRows(snapshot)).toThrow('la transacción se revirtió');
 const { admin } = clients();
 expect(checked(await admin.from('proyecto').select('id').eq('id', snapshot.rows.proyecto[0].id))).toEqual([]);
 expect(checked(await admin.from('entrega').select('id').in('id', snapshot.rows.entrega.map(e => e.id)))).toEqual([]);
});
