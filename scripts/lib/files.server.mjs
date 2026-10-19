import { createHash } from 'node:crypto';
import { clients, userClient, checked, rpc } from './local.mjs';
const MAX=3145728;
export async function cleanupFiles({fileId}={}) {
 const {admin}=clients(); let total=0;
 do {
  const candidates=await rpc(admin,'marcar_limpieza',{p_limite:100,p_archivo_compensacion_id:fileId??null});
  for(const file of candidates) {
   checked(await admin.storage.from('evidencias').remove([file.rutaObjeto]));
   await rpc(admin,'confirmar_eliminacion',{p_archivo_id:file.id}); total++;
  }
  if(fileId || candidates.length<100)break;
 }while(true);
 return total;
}
export async function uploadPdf({accessToken,entregaId,versionEsperada,nombre,bytes}) {
 if(!Buffer.isBuffer(bytes) || bytes.length<1 || bytes.length>MAX)throw new Error('TAMANO_EXCEDIDO');
 if(typeof nombre!=='string' || nombre.length>255 || /[\x00-\x1f/\\]/.test(nombre) || !nombre.toLowerCase().endsWith('.pdf'))throw new Error('DATOS_INVALIDOS');
 if(bytes.subarray(0,5).toString()!=='%PDF-' || !/%%EOF\s*$/.test(bytes.subarray(-1024).toString('latin1')))throw new Error('DATOS_INVALIDOS');
 const {anon,admin}=clients();
 const {user}=checked(await anon.auth.getUser(accessToken)); if(!user)throw new Error('SIN_SESION');
 const caller=userClient(accessToken);
 const entrega=checked(await caller.from('entrega').select('actividad_id').eq('id',entregaId).single());
 const actividad=checked(await caller.from('actividad_sqa').select('responsable_id,estado').eq('id',entrega.actividad_id).single());
 if(actividad.responsable_id!==user.id || actividad.estado!=='En progreso')throw new Error('PROHIBIDO');
 const reserved=await rpc(admin,'reservar_archivo',{p_actor_verificado_id:user.id,p_entrega_id:entregaId,p_version_esperada:versionEsperada,p_metadata_validada:{nombreArchivo:nombre,mimeType:'application/pdf',tamanoBytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}});
 // Un resultado ambiguo de transferencia/confirmación NO provoca borrado inmediato.
 checked(await admin.storage.from('evidencias').upload(reserved.rutaObjeto,bytes,{contentType:'application/pdf',upsert:false,cacheControl:'0'}));
 const result=await admin.rpc('confirmar_archivo',{p_actor_verificado_id:user.id,p_archivo_id:reserved.id,p_version_esperada:versionEsperada});
 if(result.error) {
  // Solo compensar un rechazo transaccional conocido, nunca errores de transporte.
  if(['P0001','23514','23503'].includes(result.error.code))await cleanupFiles({fileId:reserved.id}).catch(()=>{});
  checked(result);
 }
 return result.data;
}
