import { pathToFileURL } from 'node:url';
import { uploadPdf } from './lib/files.server.mjs';
import { samplePdf } from './lib/fixtures.mjs';
import { clients, provisionUsers, configureStorage, checked, rpc, stableId } from './lib/local.mjs';
export async function seedDevelopment({large=false}={}) {
 const users=await provisionUsers(); await configureStorage();
 const [qa1,qa2,m1,m2,m3,m4]=users;
 const tiposA=checked(await qa1.client.from('tipo_actividad').select('*').order('codigo'));
 const tiposM=checked(await qa1.client.from('tipo_metrica').select('*').order('codigo'));
 const metricas=tiposM.map(t=>({tipoId:t.id,objetivo:t.codigo==='M-01'?'90':t.codigo==='M-04'?'0':'100',...(t.codigo==='M-01'?{objetivoCritico:'100'}:{})}));
 async function project(qa,label,members,all=true) {
  return rpc(qa.client,'crear_proyecto',{
   p_solicitud_id:stableId(`proyecto:${label}`),p_nombre:`QAlly demo ${label}`,p_descripcion:'Datos ficticios de desarrollo; no utilizar en producción.',
   p_fecha_inicio:'2026-10-01',p_fecha_fin_prevista:'2026-12-15',p_periodo_academico:'2026-2',p_miembros_ids:members.map(m=>m.id),
   p_actividades_tipos_ids:all?tiposA.map(t=>t.id):[tiposA[0].id],p_metricas:metricas,
  });
 }
 const a=await project(qa1,'A',[m1,m2]); const b=await project(qa2,'B',[m3,m4],false); const c=await project(qa1,'cerrado',[m2],false);
 const getActivity=async id=>checked(await m1.client.from('actividad_sqa').select('*').eq('id',id).single());
 for(const [code,target] of [['A-01','Pendiente'],['A-03','En progreso'],['A-05','En revisión'],['A-06','Aprobada'],['A-09','Devuelta']]) {
  const tipo=tiposA.find(t=>t.codigo===code);
  let activity=checked(await qa1.client.from('actividad_sqa').select('*').eq('proyecto_id',a.id).eq('tipo_actividad_id',tipo.id).order('creado_en').limit(1).single());
  if(!activity.responsable_id) await rpc(qa1.client,'asignar_responsable',{p_actividad_id:activity.id,p_responsable_id:m1.id,p_version_esperada:String(activity.version)});
  activity=await getActivity(activity.id);
  if(target==='Pendiente') continue;
  if(activity.estado==='Pendiente') await rpc(m1.client,'iniciar_actividad',{p_actividad_id:activity.id,p_version_esperada:String(activity.version)});
  activity=await getActivity(activity.id);
  if(activity.estado==='En progreso') {
   const reviews=checked(await qa1.client.from('entrega').select('id,revision_entrega(decision)').eq('actividad_id',activity.id));
   if(target==='Devuelta' && reviews.some(e=>[e.revision_entrega].flat().filter(Boolean).some(r=>r.decision==='Devolver')))continue;
   const entrega=await rpc(m1.client,'preparar_entrega',{p_actividad_id:activity.id,p_version_esperada:String(activity.version)});
   activity=await getActivity(activity.id);
   const e=checked(await m1.client.from('entrega').select('resultado').eq('id',entrega.id).single());
   if(!e.resultado) await rpc(m1.client,'guardar_resultado',{p_entrega_id:entrega.id,p_resultado:`Resultado ficticio de ${code}.`,p_version_esperada:String(activity.version)});
   activity=await getActivity(activity.id);
   const ev=checked(await m1.client.from('evidencia').select('id').eq('entrega_id',entrega.id));
   if(!ev.length) await rpc(m1.client,'agregar_enlace',{p_entrega_id:entrega.id,p_url:`https://example.test/qally/${code}`,p_version_esperada:String(activity.version)});
   activity=await getActivity(activity.id);
   if(code==='A-03') {
    const files=checked(await m1.client.from('evidencia').select('id').eq('entrega_id',entrega.id).eq('tipo','PDF'));
    if(!files.length) await uploadPdf({accessToken:m1.token,entregaId:entrega.id,versionEsperada:String(activity.version),nombre:'evidencia-demo.pdf',bytes:samplePdf()});
    activity=await getActivity(activity.id);
   }
   if(target!=='En progreso') await rpc(m1.client,'enviar_entrega',{p_entrega_id:entrega.id,p_version_esperada:String(activity.version)});
  }
  activity=await getActivity(activity.id);
  if(activity.estado==='En revisión' && ['Aprobada','Devuelta'].includes(target)) {
   const e=checked(await qa1.client.from('entrega').select('id').eq('actividad_id',activity.id).not('enviada_en','is',null).order('numero_intento',{ascending:false}).limit(1).single());
   await rpc(qa1.client,'revisar_entrega',{p_entrega_id:e.id,p_decision:target==='Aprobada'?'Aprobar':'Devolver',p_observaciones:target==='Devuelta'?'Precisar el alcance y adjuntar los resultados completos.':null,p_version_esperada:String(activity.version)});
  }
 }
 function source(code,i) {
  const fuente_referencia=`Registro ficticio ${code}, muestra ${i}`;
  if(code==='M-01')return {aprobadas:i===1?8:10,ejecutadas:10,criticas_aprobadas:2,criticas_ejecutadas:2,fuente_referencia};
  if(code==='M-02')return {integrados_revisados:i===1?0:5,integrados:i===1?0:5,fuente_referencia};
  if(code==='M-03')return {requisitos_probados:i===1?5:10,requisitos_definidos:10,fuente_referencia};
  return {criticos_abiertos:i===1?1:0,altos_abiertos:i===1?2:0,fuente_referencia};
 }
 const metrics=checked(await qa1.client.from('metrica_proyecto').select('*').eq('proyecto_id',a.id));
 for(const tipo of tiposM) {
  const metric=metrics.find(m=>m.tipo_metrica_id===tipo.id);
  for(let i=1;i<=2;i++) await rpc(qa1.client,'registrar_medicion',{p_medicion_id:stableId(`medicion:A:${tipo.codigo}:${i}`),p_metrica_proyecto_id:metric.id,p_medida_en:`2026-10-${i===1?'10':'11'}T12:00:00Z`,p_datos_fuente:source(tipo.codigo,i)});
  if(tipo.codigo==='M-04') {
   const id=stableId('medicion:A:M-04:1'); const rows=checked(await qa1.client.from('revision_medicion').select('numero_revision').eq('medicion_id',id));
   if(rows.length===1) await rpc(qa1.client,'corregir_medicion',{p_medicion_id:id,p_revision_esperada:1,p_datos_fuente:{criticos_abiertos:1,altos_abiertos:1,fuente_referencia:'Corrección ficticia de la captura antigua'}});
  }
 }
 const closed=checked(await qa1.client.from('proyecto').select('cerrado_en,version').eq('id',c.id).single());
 if(!closed.cerrado_en) await rpc(qa1.client,'cerrar_proyecto',{p_proyecto_id:c.id,p_version_esperada:String(closed.version)});
 if(large) {
  const existing=checked(await qa1.client.from('actividad_sqa').select('descripcion').eq('proyecto_id',a.id));
  const descriptions=new Set(existing.map(x=>x.descripcion)); const work=[];
  for(let i=11;i<=1000;i++) {
   const description=`Carga reproducible ${i}`;
   if(!descriptions.has(description))work.push(()=>rpc(qa1.client,'agregar_actividad',{p_proyecto_id:a.id,p_tipo_id:tiposA[(i-1)%tiposA.length].id,p_descripcion:description}));
  }
  for(const tipo of tiposM)for(let i=3;i<=1000;i++) {
   const metric=metrics.find(m=>m.tipo_metrica_id===tipo.id);
   work.push(()=>rpc(qa1.client,'registrar_medicion',{p_medicion_id:stableId(`medicion:A:${tipo.codigo}:${i}`),p_metrica_proyecto_id:metric.id,p_medida_en:new Date(Date.UTC(2026,9,12,0,0,i)).toISOString(),p_datos_fuente:source(tipo.codigo,i)}));
  }
  for(let i=0;i<work.length;i+=12)await Promise.all(work.slice(i,i+12).map(fn=>fn()));
 }
 return {users,projects:{a:a.id,b:b.id,closed:c.id},tiposA,tiposM};
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href) {
 try { await seedDevelopment({large:process.argv.includes('--large')}); console.log('Seed local completado: 6 cuentas, 3 proyectos aislados, actividades y mediciones con historial.');console.log('Correos: qa1/qa2 y miembro1..4 @qally.example.test. Contraseña en .env.local (no se muestra).'); }
 catch(e) { console.error(e.message);process.exitCode=1; }
}
