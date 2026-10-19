begin;
create function public.reservar_archivo(p_actor_verificado_id uuid,p_entrega_id uuid,p_version_esperada bigint,p_metadata_validada jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.entrega; pid uuid; fid uuid:=gen_random_uuid(); f public.archivo_evidencia; begin
 if p_actor_verificado_id is null or jsonb_typeof(p_metadata_validada) is distinct from 'object' or p_metadata_validada-array['nombreArchivo','mimeType','tamanoBytes','sha256']<>'{}'::jsonb then perform private.fallar('DATOS_INVALIDOS'); end if;
 e:=private.entrega_editable(p_entrega_id,p_version_esperada,p_actor_verificado_id);
 select proyecto_id into pid from public.actividad_sqa where id=e.actividad_id;
 insert into public.archivo_evidencia(id,proyecto_id,entrega_origen_id,creado_por,ruta_objeto,nombre_archivo,mime_type,tamano_bytes,sha256)
 values(fid,pid,e.id,p_actor_verificado_id,pid::text||'/'||fid::text||'.pdf',p_metadata_validada->>'nombreArchivo',p_metadata_validada->>'mimeType',(p_metadata_validada->>'tamanoBytes')::bigint,p_metadata_validada->>'sha256') returning * into f;
 return jsonb_build_object('id',f.id,'rutaObjeto',f.ruta_objeto,'reservaHasta',f.reserva_hasta); end $$;
create function public.confirmar_archivo(p_actor_verificado_id uuid,p_archivo_id uuid,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.archivo_evidencia; e public.entrega; a public.actividad_sqa; ev public.evidencia; begin
 select * into f from public.archivo_evidencia where id=p_archivo_id;
 if p_actor_verificado_id is null or f.creado_por is distinct from p_actor_verificado_id then perform private.fallar('NO_DISPONIBLE'); end if;
 -- Idempotencia de una confirmación cuya respuesta se perdió: nunca duplica la referencia.
 if f.estado='Disponible' then
  if not exists(select 1 from public.participacion_proyecto where proyecto_id=f.proyecto_id and usuario_id=p_actor_verificado_id) then perform private.fallar('NO_DISPONIBLE'); end if;
  select * into ev from public.evidencia where archivo_id=f.id and entrega_id=f.entrega_origen_id limit 1;
  if not found then perform private.fallar('CONFLICTO'); end if;
  select * into e from public.entrega where id=f.entrega_origen_id; select * into a from public.actividad_sqa where id=e.actividad_id;
  return jsonb_build_object('id',ev.id,'archivoId',f.id,'version',a.version::text);
 end if;
 e:=private.entrega_editable(f.entrega_origen_id,p_version_esperada,p_actor_verificado_id);
 select * into f from public.archivo_evidencia where id=p_archivo_id for update;
 if f.estado<>'Reservado' or f.reserva_hasta<=clock_timestamp() then perform private.fallar('CONFLICTO'); end if;
 if not exists(select 1 from storage.objects where bucket_id='evidencias' and name=f.ruta_objeto and (metadata->>'size')::bigint=f.tamano_bytes and metadata->>'mimetype'='application/pdf') then perform private.fallar('DATOS_INVALIDOS'); end if;
 update public.archivo_evidencia set estado='Disponible',actualizado_en=clock_timestamp() where id=f.id;
 insert into public.evidencia(entrega_id,tipo,archivo_id,autor_id) values(e.id,'PDF',f.id,p_actor_verificado_id) returning * into ev;
 update public.actividad_sqa set version=version+1 where id=e.actividad_id;
 return jsonb_build_object('id',ev.id,'archivoId',f.id,'version',(p_version_esperada+1)::text); end $$;
create function public.marcar_limpieza(p_limite integer default 100,p_archivo_compensacion_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.archivo_evidencia; result jsonb:='[]'; begin
 if p_limite is null or p_limite not between 1 and 100 then perform private.fallar('DATOS_INVALIDOS'); end if;
 for f in select * from public.archivo_evidencia a where
  a.estado in ('Reservado','Disponible','Eliminando') and
  (case when p_archivo_compensacion_id is not null then a.id=p_archivo_compensacion_id else
    a.estado='Eliminando' or (a.reserva_hasta<clock_timestamp() and a.sin_referencias_desde<clock_timestamp()-interval '24 hours') end)
  and not exists(select 1 from public.evidencia where archivo_id=a.id)
  order by a.id limit p_limite for update skip locked loop
  -- Nueva sentencia después de obtener el bloqueo; revalidar una posible referencia concurrente.
  if exists(select 1 from public.evidencia where archivo_id=f.id) then continue; end if;
  update public.archivo_evidencia set estado='Eliminando',actualizado_en=clock_timestamp(),reserva_hasta=least(reserva_hasta,clock_timestamp()) where id=f.id;
  result:=result||jsonb_build_array(jsonb_build_object('id',f.id,'rutaObjeto',f.ruta_objeto));
 end loop;
 return result; end $$;
create function public.confirmar_eliminacion(p_archivo_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare f public.archivo_evidencia; begin
 select * into f from public.archivo_evidencia where id=p_archivo_id for update;
 if not found then perform private.fallar('NO_DISPONIBLE'); end if;
 if f.estado='Eliminado' then return; end if;
 if f.estado<>'Eliminando' or exists(select 1 from public.evidencia where archivo_id=f.id) or exists(select 1 from storage.objects where bucket_id='evidencias' and name=f.ruta_objeto) then perform private.fallar('CONFLICTO'); end if;
 update public.archivo_evidencia set estado='Eliminado',actualizado_en=clock_timestamp() where id=f.id; end $$;
create function private.archivo_visible(p_ruta text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.archivo_evidencia f where f.ruta_objeto=p_ruta and f.estado='Disponible' and private.participa(f.proyecto_id) and exists(select 1 from public.evidencia e where e.archivo_id=f.id)) $$;
grant execute on function private.archivo_visible(text) to authenticated;
create policy evidencia_pdf_lectura on storage.objects for select to authenticated using(bucket_id='evidencias' and private.archivo_visible(name));
-- Sin políticas INSERT/UPDATE/DELETE de usuario sobre el bucket privado.
-- El bucket se configura por API/CLI, no escribiendo tablas internas de Storage.

do $$ declare f record; begin
 for f in select oid::regprocedure as signature,proname from pg_proc where pronamespace='public'::regnamespace and proname=any(array[
 'crear_proyecto','editar_proyecto','cerrar_proyecto','buscar_miembros_elegibles','agregar_metrica','configurar_objetivo','registrar_medicion','corregir_medicion','consultar_metrica',
 'agregar_actividad','asignar_responsable','iniciar_actividad','preparar_entrega','guardar_resultado','agregar_enlace','quitar_evidencia','enviar_entrega','revisar_entrega','consultar_resumen',
 'reservar_archivo','confirmar_archivo','marcar_limpieza','confirmar_eliminacion']) loop
 execute format('revoke all on function %s from public, anon, authenticated, service_role',f.signature);
 if f.proname in ('reservar_archivo','confirmar_archivo','marcar_limpieza','confirmar_eliminacion') then
  execute format('grant execute on function %s to service_role',f.signature);
 else execute format('grant execute on function %s to authenticated',f.signature); end if;
 end loop;
end $$;
notify pgrst, 'reload schema';
commit;
