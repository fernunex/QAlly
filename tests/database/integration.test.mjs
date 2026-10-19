import { beforeAll, describe, expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { seedDevelopment } from '../../scripts/seed-dev.mjs';
import { clients,checked,rpc,userClient } from '../../scripts/lib/local.mjs';
import { uploadPdf,cleanupFiles } from '../../scripts/lib/files.server.mjs';
let seed,qa,other,member,stranger,admin,anon;
const pdf=Buffer.from('%PDF-1.4\n1 0 obj <</Type /Catalog>> endobj\ntrailer <</Root 1 0 R>>\n%%EOF\n');
const source=(count=0)=>({criticos_abiertos:count,altos_abiertos:0,fuente_referencia:'Prueba de integración'});
async function project(extra={}) {return rpc(qa.client,'crear_proyecto',{p_solicitud_id:randomUUID(),p_nombre:'Proyecto de integración',p_descripcion:'Verificación aislada',p_fecha_inicio:'2026-10-01',p_miembros_ids:[member.id],...extra});}
async function activity(pid) {return rpc(qa.client,'agregar_actividad',{p_proyecto_id:pid,p_tipo_id:seed.tiposA[0].id,p_descripcion:'Instancia repetible de prueba'});}
async function draft(pid) {
 let a=await activity(pid);a=await rpc(qa.client,'asignar_responsable',{p_actividad_id:a.id,p_responsable_id:member.id,p_version_esperada:a.version});
 a=await rpc(member.client,'iniciar_actividad',{p_actividad_id:a.id,p_version_esperada:a.version});
 const e=await rpc(member.client,'preparar_entrega',{p_actividad_id:a.id,p_version_esperada:a.version});
 return {a:{...a,version:e.version},e};
}
const rejected=async(promise,code)=>{const result=await promise;expect(result.error,JSON.stringify(result.data)).toBeTruthy();if(code)expect(result.error.message).toContain(code);return result.error;};
beforeAll(async()=>{
 seed=await seedDevelopment();[qa,other,member,,stranger]=seed.users;({admin,anon}=clients());
});
describe('Supabase local: identidad, esquema y RLS',()=>{
 test('catálogos exactos y bucket privado de 3 MiB',async()=>{
  expect(seed.tiposA).toHaveLength(10);expect(seed.tiposM).toHaveLength(4);
  expect(seed.tiposA.filter(t=>t.preseleccionada).map(t=>t.codigo)).toEqual(['A-01','A-03','A-05','A-06','A-09']);
  expect(seed.tiposM.every(t=>t.etapa_codigo==='desarrollo')).toBe(true);
  const bucket=checked(await admin.storage.getBucket('evidencias'));expect(bucket.public).toBe(false);expect(Number(bucket.file_size_limit)).toBe(3145728);
 });
 test('sin sesión no se consultan datos ni se invocan mutaciones; registro público deshabilitado',async()=>{
  await rejected(anon.from('proyecto').select('*'));await rejected(anon.rpc('crear_proyecto',{}));
  const r=await anon.auth.signUp({email:`${randomUUID()}@example.test`,password:'NoEsUnaClaveReal123!'});expect(r.error).toBeTruthy();
 });
 test('QA y Miembro solo ven proyectos autorizados; ID ajeno no revela resumen',async()=>{
  expect(checked(await qa.client.from('proyecto').select('id').eq('id',seed.projects.b))).toEqual([]);
  expect(checked(await member.client.from('proyecto').select('id').eq('id',seed.projects.b))).toEqual([]);
  await rejected(qa.client.rpc('consultar_resumen',{p_proyecto_id:seed.projects.b}),'NO_DISPONIBLE');
  await rejected(member.client.rpc('consultar_resumen',{p_proyecto_id:randomUUID()}),'NO_DISPONIBLE');
 });
 test('sin escritura directa ni autoasignación de rol/participación',async()=>{
  await rejected(member.client.from('perfil').update({rol:'QA'}).eq('usuario_id',member.id));
  await rejected(member.client.from('participacion_proyecto').insert({proyecto_id:seed.projects.b,usuario_id:member.id}));
  await rejected(qa.client.from('actividad_sqa').update({estado:'Aprobada'}).eq('proyecto_id',seed.projects.a));
  expect(checked(await member.client.from('perfil').select('rol').eq('usuario_id',member.id).single()).rol).toBe('Miembro del equipo');
 });
 test('Miembro no crea proyectos ni busca el directorio QA',async()=>{
  await rejected(member.client.rpc('crear_proyecto',{p_solicitud_id:randomUUID(),p_nombre:'No permitido',p_descripcion:'x',p_fecha_inicio:'2026-10-01'}),'PROHIBIDO');
  await rejected(member.client.rpc('buscar_miembros_elegibles',{}),'PROHIBIDO');
  const result=await rpc(qa.client,'buscar_miembros_elegibles',{});expect(result.every(p=>p.rol==='Miembro del equipo')).toBe(true);
 });
 test('Auth verifica sesión real y token inválido se rechaza',async()=>{
  const user=checked(await anon.auth.getUser(member.token)).user;expect(user.id).toBe(member.id);
  const r=await userClient('token-no-valido').from('proyecto').select('*');expect(r.error).toBeTruthy();
 });
});
describe('Proyectos: atomicidad, unicidad y cierre',()=>{
 test('alta simultánea idempotente y conflicto por contenido diferente',async()=>{
  const args={p_solicitud_id:randomUUID(),p_nombre:'Mismo registro',p_descripcion:'Datos',p_fecha_inicio:'2026-10-01',p_miembros_ids:[member.id]};
  const [a,b]=await Promise.all([rpc(qa.client,'crear_proyecto',args),rpc(qa.client,'crear_proyecto',args)]);expect(a.id).toBe(b.id);
  expect(checked(await qa.client.from('proyecto').select('id').eq('solicitud_creacion_id',args.p_solicitud_id))).toHaveLength(1);
  await rejected(qa.client.rpc('crear_proyecto',{...args,p_nombre:'Otro contenido'}),'CONFLICTO');
 });
 test('fallo en configuración inicial revierte proyecto, miembros y actividades',async()=>{
  const sid=randomUUID();await rejected(qa.client.rpc('crear_proyecto',{p_solicitud_id:sid,p_nombre:'Alta fallida',p_descripcion:'x',p_fecha_inicio:'2026-10-01',p_miembros_ids:[member.id],p_actividades_tipos_ids:[seed.tiposA[0].id],p_metricas:[{tipoId:randomUUID(),objetivo:'90'}]}));
  expect(checked(await qa.client.from('proyecto').select('id').eq('solicitud_creacion_id',sid))).toEqual([]);
 });
 test('periodo no único, datos generales validados y versión obsoleta rechazada',async()=>{
  const a=await project({p_periodo_academico:'2026-2'}),b=await project({p_periodo_academico:'2026-2'});expect(a.id).not.toBe(b.id);
  await rejected(qa.client.rpc('editar_proyecto',{p_proyecto_id:a.id,p_version_esperada:a.version,p_nombre:'x',p_descripcion:'x',p_fecha_inicio:'2026-10-01',p_fecha_fin_prevista:'2026-09-01'}));
  const edited=await rpc(qa.client,'editar_proyecto',{p_proyecto_id:a.id,p_version_esperada:a.version,p_nombre:'Editado',p_descripcion:'Alcance',p_fecha_inicio:'2026-10-01'});
  await rejected(qa.client.rpc('cerrar_proyecto',{p_proyecto_id:a.id,p_version_esperada:a.version}),'CONFLICTO');
  await rpc(qa.client,'cerrar_proyecto',{p_proyecto_id:a.id,p_version_esperada:edited.version});
  await rejected(qa.client.rpc('agregar_actividad',{p_proyecto_id:a.id,p_tipo_id:seed.tiposA[0].id,p_descripcion:'No permitido'}),'PROYECTO_CERRADO');
  expect((await rpc(member.client,'consultar_resumen',{p_proyecto_id:a.id})).proyecto.cerradoEn).toBeTruthy();
 });
 test('cierre espera una escritura en curso y luego bloquea nuevas escrituras',async()=>{
  const p=await project();
  const sql=`begin; set local role authenticated; select set_config('request.jwt.claims','${JSON.stringify({sub:qa.id,role:'authenticated'})}',true); select public.agregar_actividad('${p.id}','${seed.tiposA[0].id}','Escritura antes del cierre'); select 'QALLY_LOCK_READY'; select pg_sleep(0.8); commit;`;
  const proc=spawn('docker',['exec','-i','supabase_db_qally','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At']);
  let text='',err='';proc.stdout.on('data',b=>{text+=b.toString();});proc.stderr.on('data',b=>{err+=b.toString();});
  const ended=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',code=>code===0?resolve():reject(new Error(err)));});proc.stdin.end(sql);
  await new Promise((resolve,reject)=>{const started=Date.now();const t=setInterval(()=>{if(text.includes('QALLY_LOCK_READY')){clearInterval(t);resolve();}else if(Date.now()-started>5000){clearInterval(t);reject(new Error('No se obtuvo el bloqueo esperado'));}},20);});
  const before=Date.now();await rpc(qa.client,'cerrar_proyecto',{p_proyecto_id:p.id,p_version_esperada:'1'});expect(Date.now()-before).toBeGreaterThan(300);await ended;
  await rejected(qa.client.rpc('agregar_actividad',{p_proyecto_id:p.id,p_tipo_id:seed.tiposA[0].id,p_descripcion:'Posterior'}),'PROYECTO_CERRADO');
 });
});
describe('Métricas e historial',()=>{
 test('tipo único por proyecto incluso en altas simultáneas',async()=>{
  const p=await project(),t=seed.tiposM[3];const args={p_proyecto_id:p.id,p_tipo_id:t.id,p_objetivo:'0'};
  const r=await Promise.all([qa.client.rpc('agregar_metrica',args),qa.client.rpc('agregar_metrica',args)]);expect(r.filter(x=>!x.error)).toHaveLength(1);expect(r.filter(x=>x.error)).toHaveLength(1);
  await rejected(member.client.rpc('agregar_metrica',args),'PROHIBIDO');
 });
 test('cero explícito, historial, corrección antigua y concurrencia de correcciones',async()=>{
  const p=await project();const m=await rpc(qa.client,'agregar_metrica',{p_proyecto_id:p.id,p_tipo_id:seed.tiposM[3].id,p_objetivo:'0'});
  expect(m.condicionPrincipal).toBe('Sin medición');const old=randomUUID(),now=randomUUID();
  const args={p_medicion_id:old,p_metrica_proyecto_id:m.id,p_medida_en:'2026-10-01T00:00:00Z',p_datos_fuente:source(4)};
  await rpc(qa.client,'registrar_medicion',args);const retry=await rpc(qa.client,'registrar_medicion',args);expect(retry.reutilizada).toBe(true);
  await rpc(qa.client,'registrar_medicion',{p_medicion_id:now,p_metrica_proyecto_id:m.id,p_medida_en:'2026-10-02T00:00:00Z',p_datos_fuente:source()});
  const corrections=await Promise.all([1,2].map(n=>qa.client.rpc('corregir_medicion',{p_medicion_id:old,p_revision_esperada:1,p_datos_fuente:source(n)})));
  expect(corrections.filter(x=>!x.error)).toHaveLength(1);expect(corrections.filter(x=>x.error)).toHaveLength(1);
  const result=await rpc(qa.client,'consultar_metrica',{p_metrica_proyecto_id:m.id});expect(result.valorActual).toBe('0.00000000');expect(result.cumplimiento).toBe('Cumple');
  const history=checked(await qa.client.from('revision_medicion').select('*').eq('medicion_id',old).order('numero_revision'));expect(history).toHaveLength(2);expect(history[0].valor).toBe(4);expect(history[0].autor_id).toBe(qa.id);expect(history[1].registrada_en).toBeTruthy();
  await rejected(qa.client.from('revision_medicion').update({valor:999}).eq('medicion_id',old));
  await rejected(stranger.client.rpc('consultar_metrica',{p_metrica_proyecto_id:m.id}),'NO_DISPONIBLE');
 });
 test('tasas con cero denominador no son cero; M-01 requiere muestra crítica',async()=>{
  const p=await project();const m=await rpc(qa.client,'agregar_metrica',{p_proyecto_id:p.id,p_tipo_id:seed.tiposM[0].id,p_objetivo:'90',p_objetivo_critico:'100'});
  const datos={aprobadas:0,ejecutadas:0,criticas_aprobadas:0,criticas_ejecutadas:0,fuente_referencia:'Pruebas'};
  const id=randomUUID();await rpc(qa.client,'registrar_medicion',{p_medicion_id:id,p_metrica_proyecto_id:m.id,p_medida_en:'2026-10-01T00:00:00Z',p_datos_fuente:datos});
  let cur=await rpc(qa.client,'consultar_metrica',{p_metrica_proyecto_id:m.id});expect(cur.valorActual).toBeNull();expect(cur.condicionPrincipal).toBe('No evaluable');
  await rpc(qa.client,'corregir_medicion',{p_medicion_id:id,p_revision_esperada:1,p_datos_fuente:{...datos,aprobadas:10,ejecutadas:10}});
  cur=await rpc(qa.client,'consultar_metrica',{p_metrica_proyecto_id:m.id});expect(cur.condicionPrincipal).toBe('Evaluable');expect(cur.cumplimiento).toBe('No evaluable');expect(cur.causaCritica).toBe('Sin muestra crítica');
  await rejected(qa.client.rpc('corregir_medicion',{p_medicion_id:id,p_revision_esperada:2,p_datos_fuente:{...datos,aprobadas:1,ejecutadas:2,criticas_aprobadas:2,criticas_ejecutadas:2}}),'DATOS_INVALIDOS');
  await rejected(qa.client.rpc('configurar_objetivo',{p_metrica_proyecto_id:m.id,p_configurada_en_esperada:m.configuradaEn,p_objetivo:'101',p_objetivo_critico:'100'}),'DATOS_INVALIDOS');
 });
 test('comparación exacta y validaciones de fuente/conteos/objetivo/versionado',async()=>{
  const p=await project();const m=await rpc(qa.client,'agregar_metrica',{p_proyecto_id:p.id,p_tipo_id:seed.tiposM[1].id,p_objetivo:'66.6667'});
  const args={p_medicion_id:randomUUID(),p_metrica_proyecto_id:m.id,p_medida_en:'2026-10-01T00:00:00Z',p_datos_fuente:{integrados_revisados:2,integrados:3,fuente_referencia:'PR'}};
  const row=await rpc(qa.client,'registrar_medicion',args);expect(row.metrica.cumplimiento).toBe('Incumple');
  for(const extra of [{integrados_revisados:-1},{integrados:1.5},{integrados:1000000001},{extra:1},{fuente_referencia:''},{integrados_revisados:4}])await rejected(qa.client.rpc('registrar_medicion',{...args,p_medicion_id:randomUUID(),p_datos_fuente:{...args.p_datos_fuente,...extra}}),'DATOS_INVALIDOS');
  const changed=await rpc(qa.client,'configurar_objetivo',{p_metrica_proyecto_id:m.id,p_configurada_en_esperada:m.configuradaEn,p_objetivo:'60'});expect(changed.cumplimiento).toBe('Cumple');
  await rejected(qa.client.rpc('configurar_objetivo',{p_metrica_proyecto_id:m.id,p_configurada_en_esperada:m.configuradaEn,p_objetivo:'50'}),'CONFLICTO');
 });
});
describe('Actividades y archivos privados',()=>{
 test('actividad repetible, asignación del proyecto e inicio expreso',async()=>{
  const p=await project(),a=await activity(p.id),b=await activity(p.id);expect(a.id).not.toBe(b.id);
  await rejected(qa.client.rpc('asignar_responsable',{p_actividad_id:a.id,p_responsable_id:stranger.id,p_version_esperada:a.version}),'DATOS_INVALIDOS');
  const assigned=await rpc(qa.client,'asignar_responsable',{p_actividad_id:a.id,p_responsable_id:member.id,p_version_esperada:a.version});expect(assigned.estado).toBe('Pendiente');
  await rejected(qa.client.rpc('iniciar_actividad',{p_actividad_id:a.id,p_version_esperada:assigned.version}),'PROHIBIDO');
 });
 test('envío completo, devolución con observaciones, intento nuevo y revisión concurrente única',async()=>{
  const p=await project();const {a,e}=await draft(p.id);
  await rejected(member.client.rpc('enviar_entrega',{p_entrega_id:e.id,p_version_esperada:a.version}),'DATOS_INVALIDOS');
  let v=await rpc(member.client,'guardar_resultado',{p_entrega_id:e.id,p_resultado:'Resultado',p_version_esperada:a.version});
  await rejected(member.client.rpc('agregar_enlace',{p_entrega_id:e.id,p_url:'javascript:alert(1)',p_version_esperada:v.version}));
  let ev=await rpc(member.client,'agregar_enlace',{p_entrega_id:e.id,p_url:'https://example.test/evidencia',p_version_esperada:v.version});
  v=await rpc(member.client,'enviar_entrega',{p_entrega_id:e.id,p_version_esperada:ev.version});
  await rejected(member.client.rpc('guardar_resultado',{p_entrega_id:e.id,p_resultado:'No permitido',p_version_esperada:v.version}),'CONFLICTO');
  await rejected(member.client.rpc('revisar_entrega',{p_entrega_id:e.id,p_decision:'Aprobar',p_version_esperada:v.version}),'PROHIBIDO');
  await rejected(qa.client.rpc('revisar_entrega',{p_entrega_id:e.id,p_decision:'Devolver',p_version_esperada:v.version}),'DATOS_INVALIDOS');
  v=await rpc(qa.client,'revisar_entrega',{p_entrega_id:e.id,p_decision:'Devolver',p_observaciones:'Precisar evidencia',p_version_esperada:v.version});
  const next=await rpc(member.client,'preparar_entrega',{p_actividad_id:a.id,p_version_esperada:v.version});expect(next.numeroIntento).toBe(2);
  expect(checked(await member.client.from('entrega').select('resultado').eq('id',e.id).single()).resultado).toBe('Resultado');
  v=await rpc(member.client,'enviar_entrega',{p_entrega_id:next.id,p_version_esperada:next.version});
  const decisions=await Promise.all(['Aprobar','Devolver'].map(d=>qa.client.rpc('revisar_entrega',{p_entrega_id:next.id,p_decision:d,p_observaciones:'Revisión concurrente',p_version_esperada:v.version})));
  expect(decisions.filter(r=>!r.error)).toHaveLength(1);expect(decisions.filter(r=>r.error)).toHaveLength(1);
 });
 test('PDF validado, descarga autorizada, escritura directa y RPC técnicas bloqueadas',async()=>{
  const p=await project();const {a,e}=await draft(p.id);
  await expect(uploadPdf({accessToken:member.token,entregaId:e.id,versionEsperada:a.version,nombre:'falso.pdf',bytes:Buffer.from('no pdf')})).rejects.toThrow('DATOS_INVALIDOS');
  await expect(uploadPdf({accessToken:member.token,entregaId:e.id,versionEsperada:a.version,nombre:'grande.pdf',bytes:Buffer.alloc(3145729)})).rejects.toThrow('TAMANO_EXCEDIDO');
  await rejected(member.client.rpc('marcar_limpieza',{}));await rejected(member.client.rpc('reservar_archivo',{p_actor_verificado_id:member.id,p_entrega_id:e.id,p_version_esperada:a.version,p_metadata_validada:{}}));
  expect((await member.client.storage.from('evidencias').upload(`${p.id}/${randomUUID()}.pdf`,pdf,{contentType:'application/pdf'})).error).toBeTruthy();
  const uploaded=await uploadPdf({accessToken:member.token,entregaId:e.id,versionEsperada:a.version,nombre:'evidencia.pdf',bytes:pdf});
  const file=checked(await member.client.from('archivo_evidencia').select('*').eq('id',uploaded.archivoId).single());
  const own=await member.client.storage.from('evidencias').download(file.ruta_objeto);expect(own.error).toBeNull();expect(Buffer.from(await own.data.arrayBuffer())).toEqual(pdf);
  expect((await stranger.client.storage.from('evidencias').download(file.ruta_objeto)).error).toBeTruthy();
  expect((await anon.storage.from('evidencias').download(file.ruta_objeto)).error).toBeTruthy();
  expect((await member.client.storage.from('evidencias').update(file.ruta_objeto,pdf,{contentType:'application/pdf'})).error).toBeTruthy();
  expect(await rpc(admin,'marcar_limpieza',{p_archivo_compensacion_id:file.id})).toEqual([]);
  await rpc(member.client,'quitar_evidencia',{p_evidencia_id:uploaded.id,p_version_esperada:uploaded.version});
  expect(await cleanupFiles({fileId:file.id})).toBe(1);
  expect(checked(await admin.from('archivo_evidencia').select('estado').eq('id',file.id).single()).estado).toBe('Eliminado');
 });
 test('un PDF reutilizado por otro intento nunca es elegible para limpieza',async()=>{
  const p=await project();const {a,e}=await draft(p.id);
  const file=await uploadPdf({accessToken:member.token,entregaId:e.id,versionEsperada:a.version,nombre:'compartido.pdf',bytes:pdf});
  let v=await rpc(member.client,'guardar_resultado',{p_entrega_id:e.id,p_resultado:'PDF original',p_version_esperada:file.version});
  v=await rpc(member.client,'enviar_entrega',{p_entrega_id:e.id,p_version_esperada:v.version});
  v=await rpc(qa.client,'revisar_entrega',{p_entrega_id:e.id,p_decision:'Devolver',p_observaciones:'Revisar',p_version_esperada:v.version});
  const next=await rpc(member.client,'preparar_entrega',{p_actividad_id:a.id,p_version_esperada:v.version});
  const references=checked(await member.client.from('evidencia').select('*').eq('archivo_id',file.archivoId));expect(references).toHaveLength(2);
  const current=references.find(x=>x.entrega_id===next.id);
  await rpc(member.client,'quitar_evidencia',{p_evidencia_id:current.id,p_version_esperada:next.version});
  expect(await rpc(admin,'marcar_limpieza',{p_archivo_compensacion_id:file.archivoId})).toEqual([]);
 });
 test('cierre durante carga impide confirmar y archivo pendiente se puede compensar',async()=>{
  const p=await project();const {a,e}=await draft(p.id);
  const reserved=await rpc(admin,'reservar_archivo',{p_actor_verificado_id:member.id,p_entrega_id:e.id,p_version_esperada:a.version,p_metadata_validada:{nombreArchivo:'interrumpido.pdf',mimeType:'application/pdf',tamanoBytes:pdf.length,sha256:'a'.repeat(64)}});
  checked(await admin.storage.from('evidencias').upload(reserved.rutaObjeto,pdf,{contentType:'application/pdf'}));
  await rpc(qa.client,'cerrar_proyecto',{p_proyecto_id:p.id,p_version_esperada:'1'});
  await rejected(admin.rpc('confirmar_archivo',{p_actor_verificado_id:member.id,p_archivo_id:reserved.id,p_version_esperada:a.version}),'PROYECTO_CERRADO');
  expect(checked(await member.client.from('evidencia').select('id').eq('entrega_id',e.id))).toEqual([]);
  expect(await cleanupFiles({fileId:reserved.id})).toBe(1);
 });
 test('resumen consistente: tres etapas, datos actuales y salud Sin evaluar',async()=>{
  const result=await rpc(member.client,'consultar_resumen',{p_proyecto_id:seed.projects.a});
  expect(result.etapas.map(x=>x.codigo)).toEqual(['requerimientos','diseno','desarrollo']);expect(result.metricas).toHaveLength(4);
  expect(result.salud).toEqual({estado:'Sin evaluar',motivo:'Algoritmo pendiente'});expect(result.etapas.every(x=>x.salud.estado==='Sin evaluar')).toBe(true);
 });
});
