import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assertLocal, clients, checked, provisionUsers, configureStorage } from './lib/local.mjs';

const directory = new URL('./fixtures/proyecto-equipo/', import.meta.url);
export const teamSnapshot = JSON.parse(readFileSync(new URL('datos.json', directory), 'utf8'));
const tables = ['proyecto', 'participacion_proyecto', 'actividad_sqa', 'entrega', 'archivo_evidencia',
 'evidencia', 'revision_entrega', 'metrica_proyecto', 'medicion', 'revision_medicion'];
const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// Restauración administrativa LOCAL, con constraints y triggers activos. No cambia
// el esquema, no instala RPC y no habilita escrituras de usuarios de la aplicación.
export function restoreTeamRows(snapshot) {
 assertLocal();
 if (snapshot.formato !== 1 || snapshot.rows.proyecto.length !== 1) throw new Error('Captura de equipo inválida.');
 const rows = structuredClone(snapshot.rows);
 const project = rows.proyecto[0];
 // Las evidencias solo pueden insertarse con actividad En progreso y entrega sin
 // enviar. Se restablecen estados y fechas dentro de la misma transacción.
 const activities = structuredClone(rows.actividad_sqa);
 const deliveries = structuredClone(rows.entrega);
 rows.actividad_sqa = activities.map(a => ({ ...a,
  estado: a.estado === 'Pendiente' ? 'Pendiente' : 'En progreso',
  version: a.estado === 'Pendiente' ? a.version : a.version - 1,
 }));
 rows.entrega = deliveries.map(e => ({ ...e, enviada_en: null }));
 const inserts = tables.flatMap(table => {
  if (!rows[table]?.length) return [];
  const columns = Object.keys(rows[table][0]).filter(c => !(table === 'medicion' && c === 'orden_registro'));
  // Tablas fijas y nombres de columnas del fixture versionado, nunca SQL libre.
  if (columns.some(c => !/^[a-z_][a-z_0-9]*$/.test(c))) throw new Error('Columna inválida en captura.');
  const names = columns.map(c => `"${c}"`).join(',');
  return [`insert into public.${table} (${names}) select ${names} from json_populate_recordset(null::public.${table}, ${literal(rows[table])});`];
 });
 const sql = `begin;
do $seed$
begin
 perform pg_advisory_xact_lock(hashtextextended('qally:seed-equipo', 0));
 if exists(select 1 from public.proyecto where id = (${literal(project.id)}::jsonb #>> '{}')::uuid) then
  raise notice 'QALLY_TEAM_EXISTS'; return;
 end if;
 ${inserts.join('\n')}
 update public.entrega e set enviada_en = s.enviada_en
 from json_populate_recordset(null::public.entrega, ${literal(deliveries)}) s
 where e.id = s.id and s.enviada_en is not null;
 update public.actividad_sqa a set estado = s.estado, version = s.version
 from json_populate_recordset(null::public.actividad_sqa, ${literal(activities)}) s
 where a.id = s.id and s.estado <> 'Pendiente';
 update public.archivo_evidencia a set actualizado_en = s.actualizado_en,
 sin_referencias_desde = s.sin_referencias_desde
 from json_populate_recordset(null::public.archivo_evidencia, ${literal(rows.archivo_evidencia)}) s
 where a.id = s.id;
 raise notice 'QALLY_TEAM_CREATED';
end $seed$;
commit;`;
 // La conexión no usa contraseñas ni una URL remota: solo el contenedor local
 // que levanta supabase/config.toml (project_id = qally).
 const result = spawnSync('docker', ['exec', '-i', 'supabase_db_qally', 'psql', '-X', '-U', 'postgres',
  '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: sql, encoding: 'utf8', maxBuffer: 1024 * 1024 });
 if (result.error || result.status !== 0) {
  // No volcar el SQL/fixture ni detalles del servidor en logs.
  throw new Error('No se pudo restaurar el proyecto; la transacción se revirtió. Comprueba Docker, db:start y compatibilidad de migraciones.', { cause: result.error || new Error(result.stderr) });
 }
 return result.stderr.includes('QALLY_TEAM_CREATED') ? 'created' : 'exists';
}

export async function seedTeam({ snapshot = teamSnapshot, filesDirectory = directory } = {}) {
 const { admin } = clients(); // Rechaza cualquier destino distinto del local.
 const project = snapshot.rows.proyecto[0];
 const existing = checked(await admin.from('proyecto').select('id').eq('id', project.id).maybeSingle());
 if (existing) return { status: 'exists', id: project.id };
 // Comprobar todos los binarios antes de crear cuentas o cargar archivos.
 const files = snapshot.rows.archivo_evidencia.map(file => {
  const bytes = readFileSync(new URL(`${file.id}.pdf`, filesDirectory));
  if (bytes.length !== file.tamano_bytes || digest(bytes) !== file.sha256) throw new Error('El PDF del seed no coincide con su captura.');
  return { file, bytes };
 });
 await provisionUsers();
 await configureStorage();
 for (const { file, bytes } of files) {
  const found = await admin.storage.from('evidencias').download(file.ruta_objeto);
  if (!found.error) {
   if (digest(Buffer.from(await found.data.arrayBuffer())) !== file.sha256) throw new Error('Ya existe otro PDF en la ruta del seed; no se sobrescribe.');
  } else if (String(found.error.statusCode) === '404' || found.error.message === 'Object not found') {
   checked(await admin.storage.from('evidencias').upload(file.ruta_objeto, bytes, { contentType: 'application/pdf', upsert: false }));
  } else checked(found);
 }
 const status = restoreTeamRows(snapshot);
 return { status, id: project.id };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
 try {
  const result = await seedTeam();
  console.log(result.status === 'created'
   ? 'Proyecto QAlly restaurado: 10 actividades SQA, 10 entregas, 7 evidencias (1 PDF), 4 métricas y 3 mediciones.'
   : 'El proyecto QAlly ya existe; se conservan sus datos y cambios locales.');
  console.log('Acceso: qa1, miembro1 y miembro2 @qally.example.test. Contraseña local en .env.local.');
 } catch (error) { console.error(error.message); process.exitCode = 1; }
}
