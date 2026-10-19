begin;
create function public.crear_proyecto(p_solicitud_id uuid,p_nombre text,p_descripcion text,p_fecha_inicio date,
 p_periodo_academico text default null,p_fecha_fin_prevista date default null,p_miembros_ids uuid[] default '{}',p_actividades_tipos_ids uuid[] default '{}',p_metricas jsonb default '[]')
 returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid; pid uuid; h text; existente public.proyecto; tid uuid; item jsonb; normal jsonb; begin
 uid:=private.exigir_sesion(); if not private.es_qa() then perform private.fallar('PROHIBIDO'); end if;
 if p_solicitud_id is null or p_nombre is null or p_descripcion is null or p_fecha_inicio is null or p_miembros_ids is null or p_actividades_tipos_ids is null or jsonb_typeof(p_metricas) is distinct from 'array' then perform private.fallar('DATOS_INVALIDOS'); end if;
 if cardinality(p_miembros_ids)<>(select count(distinct x) from unnest(p_miembros_ids) x) or cardinality(p_actividades_tipos_ids)<>(select count(distinct x) from unnest(p_actividades_tipos_ids) x) then perform private.fallar('DATOS_INVALIDOS'); end if;
 if exists(select 1 from jsonb_array_elements(p_metricas) x where jsonb_typeof(x)<>'object' or not(x ? 'tipoId') or not(x ? 'objetivo') or x - array['tipoId','objetivo','objetivoCritico'] <> '{}'::jsonb) then perform private.fallar('DATOS_INVALIDOS'); end if;
 normal:=jsonb_build_object('nombre',btrim(p_nombre),'descripcion',btrim(p_descripcion),'inicio',p_fecha_inicio,'fin',p_fecha_fin_prevista,'periodo',nullif(btrim(p_periodo_academico),''),
 'miembros',(select coalesce(jsonb_agg(x order by x),'[]') from unnest(p_miembros_ids) x),
 'actividades',(select coalesce(jsonb_agg(x order by x),'[]') from unnest(p_actividades_tipos_ids) x),
 'metricas',(select coalesce(jsonb_agg(jsonb_build_object('tipoId',(x->>'tipoId')::uuid,'objetivo',trim_scale((x->>'objetivo')::numeric),'objetivoCritico',trim_scale((x->>'objetivoCritico')::numeric)) order by (x->>'tipoId')::uuid),'[]') from jsonb_array_elements(p_metricas) x));
 h:=encode(sha256(convert_to(normal::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(uid::text||p_solicitud_id::text,0));
 select * into existente from public.proyecto where creado_por=uid and solicitud_creacion_id=p_solicitud_id;
 if found then
  perform private.exigir_acceso(existente.id);
  if existente.solicitud_creacion_hash<>h then perform private.fallar('CONFLICTO'); end if;
  return jsonb_build_object('id',existente.id,'version',existente.version::text,'reutilizado',true);
 end if;
 if exists(select 1 from unnest(p_miembros_ids) x where not exists(select 1 from public.perfil where usuario_id=x and rol='Miembro del equipo')) then perform private.fallar('DATOS_INVALIDOS'); end if;
 insert into public.proyecto(nombre,descripcion,periodo_academico,fecha_inicio,fecha_fin_prevista,creado_por,solicitud_creacion_id,solicitud_creacion_hash)
 values(btrim(p_nombre),btrim(p_descripcion),nullif(btrim(p_periodo_academico),''),p_fecha_inicio,p_fecha_fin_prevista,uid,p_solicitud_id,h) returning id into pid;
 insert into public.participacion_proyecto(proyecto_id,usuario_id) values(pid,uid);
 insert into public.participacion_proyecto(proyecto_id,usuario_id) select pid,x from unnest(p_miembros_ids) x;
 foreach tid in array p_actividades_tipos_ids loop
  if not exists(select 1 from public.tipo_actividad where id=tid and activa) then perform private.fallar('DATOS_INVALIDOS'); end if;
  insert into public.actividad_sqa(proyecto_id,tipo_actividad_id,descripcion,creado_por) select pid,id,descripcion,uid from public.tipo_actividad where id=tid;
 end loop;
 for item in select value from jsonb_array_elements(p_metricas) loop
  perform public.agregar_metrica(pid,(item->>'tipoId')::uuid,(item->>'objetivo')::numeric,(item->>'objetivoCritico')::numeric);
 end loop;
 return jsonb_build_object('id',pid,'version','1','reutilizado',false);
end $$;
create function public.editar_proyecto(p_proyecto_id uuid,p_version_esperada bigint,p_nombre text,p_descripcion text,p_fecha_inicio date,p_periodo_academico text default null,p_fecha_fin_prevista date default null)
 returns jsonb language plpgsql security definer set search_path='' as $$ declare p public.proyecto; begin
 perform private.exigir_acceso(p_proyecto_id,true);
 select * into p from public.proyecto where id=p_proyecto_id for update; perform private.version(p.version,p_version_esperada);
 if p.cerrado_en is not null then perform private.fallar('PROYECTO_CERRADO'); end if;
 update public.proyecto set nombre=btrim(p_nombre),descripcion=btrim(p_descripcion),fecha_inicio=p_fecha_inicio,periodo_academico=nullif(btrim(p_periodo_academico),''),fecha_fin_prevista=p_fecha_fin_prevista,actualizado_en=clock_timestamp(),version=version+1 where id=p.id returning * into p;
 return jsonb_build_object('id',p.id,'version',p.version::text); end $$;
create function public.cerrar_proyecto(p_proyecto_id uuid,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.proyecto; begin perform private.exigir_acceso(p_proyecto_id,true);
 select * into p from public.proyecto where id=p_proyecto_id for update; perform private.version(p.version,p_version_esperada);
 if p.cerrado_en is not null then perform private.fallar('PROYECTO_CERRADO'); end if;
 update public.proyecto set cerrado_en=clock_timestamp(),cerrado_por=auth.uid(),actualizado_en=clock_timestamp(),version=version+1 where id=p.id returning * into p;
 return jsonb_build_object('id',p.id,'version',p.version::text,'cerradoEn',p.cerrado_en); end $$;
create function public.buscar_miembros_elegibles(p_texto text default '',p_limite integer default 25,p_cursor uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin perform private.exigir_sesion(); if not private.es_qa() then perform private.fallar('PROHIBIDO'); end if;
 if p_limite is null or p_texto is null or p_limite not between 1 and 100 or length(p_texto)>120 then perform private.fallar('DATOS_INVALIDOS'); end if;
 return (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select usuario_id as "usuarioId",nombre,rol from public.perfil where rol='Miembro del equipo' and nombre ilike '%'||p_texto||'%' and (p_cursor is null or usuario_id>p_cursor) order by usuario_id limit p_limite) x); end $$;

-- Entrada única a la modificación de una actividad: primero proyecto, luego actividad.
create function private.bloquear_actividad(p_id uuid,p_version bigint,p_qa boolean default false,p_actor uuid default null)
 returns public.actividad_sqa language plpgsql set search_path='' as $$ declare a public.actividad_sqa; actor uuid; begin
 actor:=coalesce(p_actor,auth.uid());
 select * into a from public.actividad_sqa where id=p_id;
 if p_actor is null then perform private.exigir_acceso(a.proyecto_id,p_qa);
 else
  if not exists(select 1 from public.participacion_proyecto m join public.perfil u on u.usuario_id=m.usuario_id where m.proyecto_id=a.proyecto_id and m.usuario_id=actor and u.rol='Miembro del equipo') then perform private.fallar('NO_DISPONIBLE'); end if;
 end if;
 perform private.proyecto_abierto(a.proyecto_id);
 select * into a from public.actividad_sqa where id=p_id for update; perform private.version(a.version,p_version);
 if not p_qa and a.responsable_id is distinct from actor then perform private.fallar('PROHIBIDO'); end if;
 return a; end $$;
create function private.actividad_resultado(p_id uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',id,'version',version::text,'estado',estado,'responsableId',responsable_id) from public.actividad_sqa where id=p_id $$;
create function public.agregar_actividad(p_proyecto_id uuid,p_tipo_id uuid,p_descripcion text) returns jsonb language plpgsql security definer set search_path='' as $$
declare aid uuid; begin perform private.exigir_acceso(p_proyecto_id,true); perform private.proyecto_abierto(p_proyecto_id);
 if not exists(select 1 from public.tipo_actividad where id=p_tipo_id and activa) then perform private.fallar('DATOS_INVALIDOS'); end if;
 insert into public.actividad_sqa(proyecto_id,tipo_actividad_id,descripcion,creado_por) values(p_proyecto_id,p_tipo_id,btrim(p_descripcion),auth.uid()) returning id into aid;
 return private.actividad_resultado(aid); end $$;
create function public.asignar_responsable(p_actividad_id uuid,p_responsable_id uuid,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.actividad_sqa; begin a:=private.bloquear_actividad(p_actividad_id,p_version_esperada,true);
 if a.estado<>'Pendiente' then perform private.fallar('CONFLICTO'); end if;
 if not exists(select 1 from public.participacion_proyecto m join public.perfil p on p.usuario_id=m.usuario_id where m.proyecto_id=a.proyecto_id and m.usuario_id=p_responsable_id and p.rol='Miembro del equipo') then perform private.fallar('DATOS_INVALIDOS'); end if;
 update public.actividad_sqa set responsable_id=p_responsable_id,version=version+1 where id=a.id; return private.actividad_resultado(a.id); end $$;
create function public.iniciar_actividad(p_actividad_id uuid,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.actividad_sqa; begin a:=private.bloquear_actividad(p_actividad_id,p_version_esperada);
 if a.estado<>'Pendiente' then perform private.fallar('CONFLICTO'); end if;
 update public.actividad_sqa set estado='En progreso',version=version+1 where id=a.id; return private.actividad_resultado(a.id); end $$;
create function private.entrega_editable(p_id uuid,p_version bigint,p_actor uuid default null) returns public.entrega language plpgsql set search_path='' as $$
declare e public.entrega; a public.actividad_sqa; begin select * into e from public.entrega where id=p_id;
 a:=private.bloquear_actividad(e.actividad_id,p_version,false,p_actor);
 select * into e from public.entrega where id=p_id for update;
 if a.estado<>'En progreso' or e.enviada_en is not null or e.autor_id is distinct from coalesce(p_actor,auth.uid()) then perform private.fallar('CONFLICTO'); end if;
 return e; end $$;

-- Toda referencia bloquea su archivo y preserva el proyecto/origen del objeto.
create function private.evidencia_guard() returns trigger language plpgsql set search_path='' as $$
declare e public.entrega; a public.actividad_sqa; f public.archivo_evidencia; fid uuid; begin
 if tg_op='UPDATE' then perform private.fallar('PROHIBIDO'); end if;
 select * into e from public.entrega where id=case when tg_op='DELETE' then old.entrega_id else new.entrega_id end;
 select * into a from public.actividad_sqa where id=e.actividad_id;
 if e.enviada_en is not null or a.estado<>'En progreso' then perform private.fallar('CONFLICTO'); end if;
 fid:=case when tg_op='DELETE' then old.archivo_id else new.archivo_id end;
 if fid is not null then
  select * into f from public.archivo_evidencia where id=fid for update;
  if f.proyecto_id<>a.proyecto_id or f.estado<>'Disponible' then perform private.fallar('DATOS_INVALIDOS'); end if;
 end if;
 if tg_op='DELETE' then return old; end if; return new; end $$;
create trigger evidencia_guard before insert or update or delete on public.evidencia for each row execute function private.evidencia_guard();
create function private.actualizar_referencias() returns trigger language plpgsql set search_path='' as $$
declare fid uuid; begin fid:=case when tg_op='DELETE' then old.archivo_id else new.archivo_id end;
 if fid is not null then update public.archivo_evidencia set sin_referencias_desde=case when exists(select 1 from public.evidencia where archivo_id=fid) then null else clock_timestamp() end,actualizado_en=clock_timestamp() where id=fid; end if;
 return null; end $$;
create trigger evidencia_referencias after insert or delete on public.evidencia for each row execute function private.actualizar_referencias();
create function public.preparar_entrega(p_actividad_id uuid,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.actividad_sqa; e public.entrega; anterior public.entrega; ev public.evidencia; begin
 a:=private.bloquear_actividad(p_actividad_id,p_version_esperada);
 if a.estado<>'En progreso' then perform private.fallar('CONFLICTO'); end if;
 select * into e from public.entrega where actividad_id=a.id and enviada_en is null;
 if found then return jsonb_build_object('id',e.id,'actividadId',a.id,'version',a.version::text,'numeroIntento',e.numero_intento); end if;
 select * into anterior from public.entrega where actividad_id=a.id order by numero_intento desc limit 1;
 insert into public.entrega(actividad_id,numero_intento,resultado,autor_id) values(a.id,coalesce(anterior.numero_intento,0)+1,anterior.resultado,auth.uid()) returning * into e;
 -- Orden global de archivos, también al copiar un intento.
 for ev in select * from public.evidencia where entrega_id=anterior.id order by archivo_id nulls first,id loop
  insert into public.evidencia(entrega_id,tipo,archivo_id,url,autor_id) values(e.id,ev.tipo,ev.archivo_id,ev.url,auth.uid());
 end loop;
 update public.actividad_sqa set version=version+1 where id=a.id;
 return jsonb_build_object('id',e.id,'actividadId',a.id,'version',(a.version+1)::text,'numeroIntento',e.numero_intento); end $$;
create function public.guardar_resultado(p_entrega_id uuid,p_resultado text,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.entrega; begin e:=private.entrega_editable(p_entrega_id,p_version_esperada);
 update public.entrega set resultado=nullif(btrim(p_resultado),'') where id=e.id;
 update public.actividad_sqa set version=version+1 where id=e.actividad_id;
 return private.actividad_resultado(e.actividad_id); end $$;
create function public.agregar_enlace(p_entrega_id uuid,p_url text,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.entrega; eid uuid; begin e:=private.entrega_editable(p_entrega_id,p_version_esperada);
 insert into public.evidencia(entrega_id,tipo,url,autor_id) values(e.id,'Enlace',btrim(p_url),auth.uid()) returning id into eid;
 update public.actividad_sqa set version=version+1 where id=e.actividad_id;
 return jsonb_build_object('id',eid,'version',(p_version_esperada+1)::text); end $$;
create function public.quitar_evidencia(p_evidencia_id uuid,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare eid uuid; e public.entrega; begin select entrega_id into eid from public.evidencia where id=p_evidencia_id;
 e:=private.entrega_editable(eid,p_version_esperada); delete from public.evidencia where id=p_evidencia_id;
 update public.actividad_sqa set version=version+1 where id=e.actividad_id; return private.actividad_resultado(e.actividad_id); end $$;
create function public.enviar_entrega(p_entrega_id uuid,p_version_esperada bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.entrega; begin e:=private.entrega_editable(p_entrega_id,p_version_esperada);
 if e.resultado is null or btrim(e.resultado)='' or not exists(select 1 from public.evidencia where entrega_id=e.id) then perform private.fallar('DATOS_INVALIDOS'); end if;
 perform f.id from public.archivo_evidencia f join public.evidencia ev on ev.archivo_id=f.id where ev.entrega_id=e.id order by f.id for update of f;
 if exists(select 1 from public.evidencia ev join public.archivo_evidencia f on f.id=ev.archivo_id where ev.entrega_id=e.id and f.estado<>'Disponible') then perform private.fallar('DATOS_INVALIDOS'); end if;
 update public.entrega set enviada_en=clock_timestamp() where id=e.id;
 update public.actividad_sqa set estado='En revisión',version=version+1 where id=e.actividad_id; return private.actividad_resultado(e.actividad_id); end $$;
create function public.revisar_entrega(p_entrega_id uuid,p_decision text,p_version_esperada bigint,p_observaciones text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.entrega; a public.actividad_sqa; begin select * into e from public.entrega where id=p_entrega_id;
 a:=private.bloquear_actividad(e.actividad_id,p_version_esperada,true); perform 1 from public.entrega where id=e.id for update;
 if a.estado<>'En revisión' or e.enviada_en is null or exists(select 1 from public.entrega where actividad_id=a.id and numero_intento>e.numero_intento) then perform private.fallar('CONFLICTO'); end if;
 if p_decision is null or p_decision not in ('Aprobar','Devolver') or p_decision='Devolver' and coalesce(btrim(p_observaciones),'')='' then perform private.fallar('DATOS_INVALIDOS'); end if;
 if coalesce(btrim(e.resultado),'')='' or not exists(select 1 from public.evidencia where entrega_id=e.id) then perform private.fallar('DATOS_INVALIDOS'); end if;
 insert into public.revision_entrega(entrega_id,decision,observaciones,qa_id) values(e.id,p_decision,nullif(btrim(p_observaciones),''),auth.uid());
 update public.actividad_sqa set estado=case when p_decision='Aprobar' then 'Aprobada' else 'En progreso' end,version=version+1 where id=a.id;
 return private.actividad_resultado(a.id); end $$;

create function public.consultar_resumen(p_proyecto_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin perform private.exigir_acceso(p_proyecto_id);
 return (select jsonb_build_object('proyecto',jsonb_build_object('id',p.id,'nombre',p.nombre,'descripcion',p.descripcion,'periodoAcademico',p.periodo_academico,'fechaInicio',p.fecha_inicio,'fechaFinPrevista',p.fecha_fin_prevista,'cerradoEn',p.cerrado_en),'generadoEn',statement_timestamp(),
 'salud',jsonb_build_object('estado','Sin evaluar','motivo','Algoritmo pendiente'),
 'etapas',(select jsonb_agg(jsonb_build_object('codigo',et.codigo,'nombre',et.nombre,'salud',jsonb_build_object('estado','Sin evaluar','motivo','Algoritmo pendiente'),
 'conteos',(select jsonb_object_agg(s.estado,(select count(*) from public.actividad_sqa a join public.tipo_actividad t on t.id=a.tipo_actividad_id where a.proyecto_id=p.id and t.etapa_codigo=et.codigo and a.estado=s.estado)) from unnest(array['Pendiente','En progreso','En revisión','Aprobada']) as s(estado)),
 'actividades',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'tipoCodigo',t.codigo,'tipoNombre',t.nombre,'responsableNombre',pf.nombre,'estado',a.estado) order by a.creado_en,a.id),'[]') from public.actividad_sqa a join public.tipo_actividad t on t.id=a.tipo_actividad_id left join public.perfil pf on pf.usuario_id=a.responsable_id where a.proyecto_id=p.id and t.etapa_codigo=et.codigo)) order by et.orden) from public.etapa et),
 'metricas',(select coalesce(jsonb_agg(private.metrica_json(m.id) order by t.codigo),'[]') from public.metrica_proyecto m join public.tipo_metrica t on t.id=m.tipo_metrica_id where m.proyecto_id=p.id)) from public.proyecto p where p.id=p_proyecto_id);
end $$;
commit;
