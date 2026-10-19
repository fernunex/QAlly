begin;
create trigger medicion_inmutable before update or delete on public.medicion for each row execute function private.inmutable();
create function private.entrega_inmutable() returns trigger language plpgsql set search_path='' as $$ begin
 if old.enviada_en is not null or tg_op='DELETE' then perform private.fallar('PROHIBIDO'); end if;
 if (new.id,new.actividad_id,new.numero_intento,new.autor_id,new.creada_en) is distinct from (old.id,old.actividad_id,old.numero_intento,old.autor_id,old.creada_en) then perform private.fallar('PROHIBIDO'); end if;
 return new; end $$;
create trigger entrega_inmutable before update or delete on public.entrega for each row execute function private.entrega_inmutable();
create function private.proyecto_identidad() returns trigger language plpgsql set search_path='' as $$ begin
 if (new.id,new.creado_por,new.creado_en,new.solicitud_creacion_id,new.solicitud_creacion_hash) is distinct from (old.id,old.creado_por,old.creado_en,old.solicitud_creacion_id,old.solicitud_creacion_hash) or new.version<>old.version+1 then perform private.fallar('PROHIBIDO'); end if;
 return new; end $$;
create trigger proyecto_identidad before update on public.proyecto for each row execute function private.proyecto_identidad();
create function private.actividad_identidad() returns trigger language plpgsql set search_path='' as $$ begin
 if (new.id,new.proyecto_id,new.tipo_actividad_id,new.creado_por,new.creado_en) is distinct from (old.id,old.proyecto_id,old.tipo_actividad_id,old.creado_por,old.creado_en) or new.version<>old.version+1 then perform private.fallar('PROHIBIDO'); end if;
 return new; end $$;
create trigger actividad_identidad before update on public.actividad_sqa for each row execute function private.actividad_identidad();
create function private.archivo_origen() returns trigger language plpgsql set search_path='' as $$ begin
 if not exists(select 1 from public.entrega e join public.actividad_sqa a on a.id=e.actividad_id where e.id=new.entrega_origen_id and a.proyecto_id=new.proyecto_id and e.autor_id=new.creado_por) then perform private.fallar('DATOS_INVALIDOS'); end if;
 if tg_op='UPDATE' and (new.id,new.proyecto_id,new.entrega_origen_id,new.creado_por,new.ruta_objeto,new.nombre_archivo,new.mime_type,new.tamano_bytes,new.sha256,new.creado_en) is distinct from (old.id,old.proyecto_id,old.entrega_origen_id,old.creado_por,old.ruta_objeto,old.nombre_archivo,old.mime_type,old.tamano_bytes,old.sha256,old.creado_en) then perform private.fallar('PROHIBIDO'); end if;
 return new; end $$;
create trigger archivo_origen before insert or update on public.archivo_evidencia for each row execute function private.archivo_origen();
commit;
