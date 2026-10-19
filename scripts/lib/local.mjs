import { loadEnvFile } from 'node:process';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
try { loadEnvFile('.env.local'); } catch { /* Validación explícita abajo. */ }
export function assertLocal() {
 const url = process.env.SUPABASE_URL;
 if (!url || new URL(url).origin !== 'http://127.0.0.1:54321') throw new Error('Operación permitida únicamente sobre Supabase LOCAL en 127.0.0.1:54321.');
 if (!process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Falta entorno local: ejecuta npm run db:env.');
 return url;
}
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init={})=>fetch(input,{...init,signal:init.signal?AbortSignal.any([init.signal,AbortSignal.timeout(60000)]):AbortSignal.timeout(60000)})}};
export function clients() {
 const url=assertLocal();
 return { admin:createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,options), anon:createClient(url,process.env.SUPABASE_ANON_KEY,options) };
}
export function userClient(token) {
 return createClient(assertLocal(),process.env.SUPABASE_ANON_KEY,{...options,global:{...options.global,headers:{Authorization:`Bearer ${token}`}}});
}
export function checked(result) {
 if(result.error) throw new Error(`${result.error.message} (${result.error.code || 'API'})`);
 return result.data;
}
export const rpc = async (client,name,args) => checked(await client.rpc(name,args));
export function stableId(label) {
 const h=createHash('sha256').update(`qally-dev:${label}`).digest('hex');
 return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
export const accounts=[
 {email:'qa1@qally.example.test',nombre:'QA de desarrollo A',rol:'QA'},
 {email:'qa2@qally.example.test',nombre:'QA de desarrollo B',rol:'QA'},
 ...[1,2,3,4].map(i=>({email:`miembro${i}@qally.example.test`,nombre:`Miembro ${i}`,rol:'Miembro del equipo'})),
];
export async function provisionUsers() {
 const {admin}=clients();
 const password=process.env.QALLY_DEV_PASSWORD;
 if(!password || password.length<12) throw new Error('Falta contraseña local aleatoria; ejecuta npm run db:env.');
 let existing=[];
 for(let page=1;;page++) { const data=checked(await admin.auth.admin.listUsers({page,perPage:1000}));existing.push(...data.users); if(data.users.length<1000)break; }
 const users=[];
 for(const entry of accounts) {
  const id=stableId(entry.email); let user=existing.find(u=>u.email===entry.email);
  if(user && user.id!==id) throw new Error('La cuenta de desarrollo ya existe con otra identidad; no se modifica automáticamente.');
  if(!user) user=checked(await admin.auth.admin.createUser({id,email:entry.email,password,email_confirm:true})).user;
  checked(await admin.from('perfil').upsert({usuario_id:user.id,nombre:entry.nombre,rol:entry.rol}));
  const client=createClient(assertLocal(),process.env.SUPABASE_ANON_KEY,options);
  let login=await client.auth.signInWithPassword({email:entry.email,password});
  if(login.error?.code==='invalid_credentials') {
   checked(await admin.auth.admin.updateUserById(user.id,{password,email_confirm:true}));
   login=await client.auth.signInWithPassword({email:entry.email,password});
  }
  const session=checked(login).session;
  users.push({...entry,id:user.id,client,token:session.access_token});
 }
 return users;
}
export async function configureStorage() {
 const {admin}=clients();
 const buckets=checked(await admin.storage.listBuckets());
 const config={public:false,fileSizeLimit:3145728,allowedMimeTypes:['application/pdf']};
 if(buckets.some(b=>b.id==='evidencias')) checked(await admin.storage.updateBucket('evidencias',config));
 else checked(await admin.storage.createBucket('evidencias',config));
}
