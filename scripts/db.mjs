import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const cli = process.platform === 'win32' ? 'node_modules/.bin/supabase.cmd' : 'node_modules/.bin/supabase';
const redact = (s) => String(s).replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[JWT oculto]').replace(/sb_(?:secret|publishable)_[\w-]+/g, '[clave oculta]').replace(/postgres(?:ql)?:\/\/\S+/g, '[conexión oculta]');
function run(args) {
 const r = spawnSync(cli, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, env: { ...process.env, DO_NOT_TRACK: '1' } });
 if (r.status !== 0) throw new Error(redact(r.stderr || 'No se pudo ejecutar Supabase CLI.'));
 return r.stdout;
}
function localEnv() {
 const status = JSON.parse(run(['status', '-o', 'json']));
 const current = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
 const previous = Object.fromEntries(current.split('\n').filter(l=>l && !l.startsWith('#')).map(l=>{const n=l.indexOf('=');return [l.slice(0,n),l.slice(n+1)];}));
 const env = {
  SUPABASE_URL: status.API_URL,
  SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  QALLY_DEV_PASSWORD: previous.QALLY_DEV_PASSWORD || randomBytes(24).toString('base64url'),
  REPORT_SNAPSHOT_KEY_BASE64: previous.REPORT_SNAPSHOT_KEY_BASE64 || randomBytes(32).toString('base64'),
 };
 if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('CLI no devolvió las claves locales esperadas.');
 if (new URL(env.SUPABASE_URL).hostname !== '127.0.0.1') throw new Error('Se esperaba un entorno local.');
 writeFileSync('.env.local', '# Generado localmente; no versionar ni compartir.\n'+Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')+'\n', { mode: 0o600 });
 console.log('Entorno local guardado en .env.local, sin mostrar credenciales.');
}
try {
 switch (process.argv[2]) {
 case 'start': {
  const found = spawnSync('docker', ['network','inspect','qally-local'], {encoding:'utf8'});
  if (found.status===0 && JSON.parse(found.stdout)[0].Options?.['com.docker.network.bridge.host_binding_ipv4']!=='127.0.0.1') throw new Error('La red qally-local existente no limita los puertos a loopback; revisar su configuración antes de iniciar.');
  if (found.status!==0) {
   const result=spawnSync('docker',['network','create','--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1','qally-local'],{encoding:'utf8'});
   if(result.status!==0) throw new Error('No se pudo preparar la red local de Docker.');
  }
  console.log('Iniciando Supabase local (primera ejecución descarga imágenes)…');
  run(['start','--network-id','qally-local']);
  console.log('Aplicando migraciones pendientes a la base local…');
  run(['migration','up','--local']);
  localEnv();
  console.log('Supabase listo. Studio: http://127.0.0.1:54323'); break;
 }
 case 'stop': run(['stop']); console.log('Supabase detenido; datos conservados.'); break;
 case 'status': {
  const s=JSON.parse(run(['status','-o','json'])); console.log(JSON.stringify({api:s.API_URL,studio:s.STUDIO_URL},null,2)); break;
 }
 case 'env': localEnv(); break;
 case 'reset':
  if (!process.argv.includes('--confirm-local-reset')) throw new Error('El reset borra datos LOCALES. Usa npm run db:reset -- --confirm-local-reset.');
  run(['db','reset','--local','--yes','--network-id','qally-local']); localEnv(); console.log('Base LOCAL reconstruida con migraciones y referencias. Ejecuta npm run db:seed.'); break;
 case 'lint': console.log(run(['db','lint','--local','--schema','public,private','--level','error','--fail-on','error'])); break;
 case 'types': {
  const types=run(['gen','types','typescript','--local','--schema','public']);
  if (!types.includes('export type Database')) throw new Error('La generación no produjo tipos de BD.');
  mkdirSync('src/lib/supabase',{recursive:true}); writeFileSync('src/lib/supabase/database.types.ts',types.replace(/[ \t]+$/gm,'')); console.log('Tipos generados desde PostgreSQL local.'); break;
 }
 default: throw new Error('Operación de BD desconocida.');
 }
} catch(e) { console.error(redact(e.message)); process.exitCode=1; }
