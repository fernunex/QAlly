begin;
create function private.fallar(p_codigo text) returns void language plpgsql set search_path='' as $$
begin raise exception using message=p_codigo, errcode='P0001'; end $$;
create function private.tiene_perfil() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.perfil where usuario_id=auth.uid()) $$;
create function private.participa(p_proyecto uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.participacion_proyecto where proyecto_id=p_proyecto and usuario_id=auth.uid()) $$;
create function private.es_qa(p_proyecto uuid default null) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.perfil where usuario_id=auth.uid() and rol='QA') and (p_proyecto is null or private.participa(p_proyecto)) $$;
create function private.es_responsable(p_actividad uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.actividad_sqa a join public.perfil p on p.usuario_id=a.responsable_id where a.id=p_actividad and a.responsable_id=auth.uid() and p.rol='Miembro del equipo' and private.participa(a.proyecto_id)) $$;
grant execute on function private.tiene_perfil(),private.participa(uuid),private.es_qa(uuid),private.es_responsable(uuid) to authenticated;
create function private.exigir_sesion() returns uuid language plpgsql stable set search_path='' as $$
begin if auth.uid() is null or not private.tiene_perfil() then perform private.fallar('SIN_SESION'); end if; return auth.uid(); end $$;
create function private.exigir_acceso(p_proyecto uuid,p_qa boolean default false) returns void language plpgsql stable set search_path='' as $$
begin perform private.exigir_sesion(); if not private.participa(p_proyecto) then perform private.fallar('NO_DISPONIBLE'); end if;
 if p_qa and not private.es_qa(p_proyecto) then perform private.fallar('PROHIBIDO'); end if; end $$;
create function private.proyecto_abierto(p_proyecto uuid) returns void language plpgsql set search_path='' as $$
declare cerrado timestamptz; begin
 select cerrado_en into cerrado from public.proyecto where id=p_proyecto for share;
 if not found then perform private.fallar('NO_DISPONIBLE'); end if;
 if cerrado is not null then perform private.fallar('PROYECTO_CERRADO'); end if; end $$;
create function private.version(p_actual bigint,p_esperada bigint) returns void language plpgsql set search_path='' as $$
begin if p_esperada is null or p_actual<>p_esperada then perform private.fallar('CONFLICTO'); end if; end $$;

create policy perfil_lectura on public.perfil for select to authenticated using(usuario_id=auth.uid() or exists(
 select 1 from public.participacion_proyecto m where m.usuario_id=perfil.usuario_id and private.participa(m.proyecto_id)));
create policy proyecto_lectura on public.proyecto for select to authenticated using(private.participa(id));
create policy miembros_lectura on public.participacion_proyecto for select to authenticated using(private.participa(proyecto_id));
create policy etapas_lectura on public.etapa for select to authenticated using(private.tiene_perfil());
create policy tipos_actividad_lectura on public.tipo_actividad for select to authenticated using(private.tiene_perfil());
create policy tipos_metrica_lectura on public.tipo_metrica for select to authenticated using(private.tiene_perfil());
create policy actividad_lectura on public.actividad_sqa for select to authenticated using(private.participa(proyecto_id));
create policy metrica_lectura on public.metrica_proyecto for select to authenticated using(private.participa(proyecto_id));
create policy archivo_lectura on public.archivo_evidencia for select to authenticated using(private.participa(proyecto_id));
create policy entrega_lectura on public.entrega for select to authenticated using(exists(select 1 from public.actividad_sqa a where a.id=actividad_id and private.participa(a.proyecto_id)));
create policy evidencia_lectura on public.evidencia for select to authenticated using(exists(select 1 from public.entrega e where e.id=entrega_id));
create policy revision_entrega_lectura on public.revision_entrega for select to authenticated using(exists(select 1 from public.entrega e where e.id=entrega_id));
create policy medicion_lectura on public.medicion for select to authenticated using(exists(select 1 from public.metrica_proyecto m where m.id=metrica_proyecto_id and private.participa(m.proyecto_id)));
create policy revision_medicion_lectura on public.revision_medicion for select to authenticated using(exists(select 1 from public.medicion m where m.id=medicion_id));

create function private.validar_objetivo(p_codigo text,p_obj numeric,p_crit numeric) returns void language plpgsql set search_path='' as $$
begin
 if p_obj is null or p_obj::text in ('NaN','Infinity','-Infinity') or p_crit::text in ('NaN','Infinity','-Infinity') then perform private.fallar('DATOS_INVALIDOS'); end if;
 if p_codigo in ('M-01','M-02','M-03') then
  if p_obj<0 or p_obj>100 or p_obj<>trunc(p_obj,4) then perform private.fallar('DATOS_INVALIDOS'); end if;
 elsif p_codigo='M-04' then
  if p_obj<0 or p_obj>2000000000 or p_obj<>trunc(p_obj) then perform private.fallar('DATOS_INVALIDOS'); end if;
 else perform private.fallar('DATOS_INVALIDOS'); end if;
 if p_codigo='M-01' then
  if p_crit is null or p_crit<0 or p_crit>100 or p_crit<>trunc(p_crit,4) then perform private.fallar('DATOS_INVALIDOS'); end if;
 elsif p_crit is not null then perform private.fallar('DATOS_INVALIDOS'); end if;
end $$;
create function private.metrica_guard() returns trigger language plpgsql set search_path='' as $$
declare c text; begin select codigo into c from public.tipo_metrica where id=new.tipo_metrica_id;
 perform private.validar_objetivo(c,new.objetivo,new.objetivo_critico);
 if new.operador<>(case when c='M-04' then '<=' else '>=' end) then perform private.fallar('DATOS_INVALIDOS'); end if; return new; end $$;
create trigger metrica_guard before insert or update on public.metrica_proyecto for each row execute function private.metrica_guard();
create function private.inmutable() returns trigger language plpgsql set search_path='' as $$ begin perform private.fallar('PROHIBIDO'); return null; end $$;
create trigger revision_medicion_inmutable before update or delete on public.revision_medicion for each row execute function private.inmutable();
create trigger revision_entrega_inmutable before update or delete on public.revision_entrega for each row execute function private.inmutable();
create function private.responsable_guard() returns trigger language plpgsql set search_path='' as $$ begin
 if new.responsable_id is not null and not exists(select 1 from public.perfil where usuario_id=new.responsable_id and rol='Miembro del equipo') then perform private.fallar('DATOS_INVALIDOS'); end if; return new; end $$;
create trigger responsable_guard before insert or update on public.actividad_sqa for each row execute function private.responsable_guard();

create function private.calcular(p_codigo text,p_datos jsonb) returns numeric language plpgsql immutable set search_path='' as $$
declare claves text[]; k text; v numeric; n numeric; d numeric; ca numeric; ce numeric; begin
 if jsonb_typeof(p_datos) is distinct from 'object' then perform private.fallar('DATOS_INVALIDOS'); end if;
 claves:=case p_codigo when 'M-01' then array['aprobadas','ejecutadas','criticas_aprobadas','criticas_ejecutadas'] when 'M-02' then array['integrados_revisados','integrados'] when 'M-03' then array['requisitos_probados','requisitos_definidos'] when 'M-04' then array['criticos_abiertos','altos_abiertos'] else null end;
 if claves is null or (select count(*) from jsonb_object_keys(p_datos))<>cardinality(claves)+1
 or jsonb_typeof(p_datos->'fuente_referencia') is distinct from 'string' or length(btrim(p_datos->>'fuente_referencia')) not between 1 and 2048 then perform private.fallar('DATOS_INVALIDOS'); end if;
 foreach k in array claves loop
  if jsonb_typeof(p_datos->k) is distinct from 'number' then perform private.fallar('DATOS_INVALIDOS'); end if;
  v:=(p_datos->>k)::numeric;
  if v<0 or v>1000000000 or v<>trunc(v) then perform private.fallar('DATOS_INVALIDOS'); end if;
 end loop;
 if p_codigo='M-04' then return (p_datos->>'criticos_abiertos')::numeric+(p_datos->>'altos_abiertos')::numeric; end if;
 if p_codigo='M-01' then
  n:=(p_datos->>'aprobadas')::numeric; d:=(p_datos->>'ejecutadas')::numeric;
  ca:=(p_datos->>'criticas_aprobadas')::numeric; ce:=(p_datos->>'criticas_ejecutadas')::numeric;
  if ca>ce or ce>d or ca>n or n-ca>d-ce then perform private.fallar('DATOS_INVALIDOS'); end if;
 elsif p_codigo='M-02' then n:=(p_datos->>'integrados_revisados')::numeric; d:=(p_datos->>'integrados')::numeric;
 else n:=(p_datos->>'requisitos_probados')::numeric; d:=(p_datos->>'requisitos_definidos')::numeric; end if;
 if n>d then perform private.fallar('DATOS_INVALIDOS'); end if;
 if d=0 then return null; end if; return round(100*n/d,8);
end $$;
create function private.metrica_json(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare m public.metrica_proyecto; t public.tipo_metrica; med public.medicion; r public.revision_medicion;
 n numeric; d numeric; cv numeric; cumplimiento text:='No evaluable'; critica text:='Sin medición'; cumple boolean;
begin
 select * into m from public.metrica_proyecto where id=p_id; select * into t from public.tipo_metrica where id=m.tipo_metrica_id;
 select * into med from public.medicion where metrica_proyecto_id=p_id order by medida_en desc,orden_registro desc limit 1;
 select * into r from public.revision_medicion where medicion_id=med.id order by numero_revision desc limit 1;
 if r.condicion='Evaluable' then
  if t.codigo='M-04' then cumple:=r.valor<=m.objetivo;
  else
   n:=case t.codigo when 'M-01' then (r.datos_fuente->>'aprobadas')::numeric when 'M-02' then (r.datos_fuente->>'integrados_revisados')::numeric else (r.datos_fuente->>'requisitos_probados')::numeric end;
   d:=case t.codigo when 'M-01' then (r.datos_fuente->>'ejecutadas')::numeric when 'M-02' then (r.datos_fuente->>'integrados')::numeric else (r.datos_fuente->>'requisitos_definidos')::numeric end;
   cumple:=100*n>=m.objetivo*d;
  end if;
  if t.codigo='M-01' then
   if (r.datos_fuente->>'criticas_ejecutadas')::numeric=0 then cumple:=null; critica:='No evaluable';
   else
    cv:=round(100*(r.datos_fuente->>'criticas_aprobadas')::numeric/(r.datos_fuente->>'criticas_ejecutadas')::numeric,8); critica:='Evaluable';
    cumple:=cumple and 100*(r.datos_fuente->>'criticas_aprobadas')::numeric>=m.objetivo_critico*(r.datos_fuente->>'criticas_ejecutadas')::numeric;
   end if;
  end if;
  cumplimiento:=case when cumple is null then 'No evaluable' when cumple then 'Cumple' else 'Incumple' end;
 end if;
 if t.codigo='M-01' and r.condicion='No evaluable' then critica:='No evaluable'; end if;
 return jsonb_build_object('id',m.id,'proyectoId',m.proyecto_id,'tipo',jsonb_build_object('id',t.id,'codigo',t.codigo,'nombre',t.nombre,'etapaCodigo',t.etapa_codigo,'unidad',t.unidad),
 'operador',m.operador,'objetivo',m.objetivo::text,'objetivoCritico',m.objetivo_critico::text,'valorActual',r.valor::text,
 'condicionPrincipal',coalesce(r.condicion,'Sin medición'),'causa',r.causa_no_evaluable,'cumplimiento',cumplimiento,
 'valorCritico',cv::text,'condicionCritica',critica,'causaCritica',case when critica='No evaluable' then 'Sin muestra crítica' end,
 'medidaEn',med.medida_en,'configuradaEn',m.configurada_en);
end $$;
create function public.consultar_metrica(p_metrica_proyecto_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid uuid; begin select proyecto_id into pid from public.metrica_proyecto where id=p_metrica_proyecto_id; perform private.exigir_acceso(pid); return private.metrica_json(p_metrica_proyecto_id); end $$;
create function public.agregar_metrica(p_proyecto_id uuid,p_tipo_id uuid,p_objetivo numeric,p_objetivo_critico numeric default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.tipo_metrica; mid uuid; begin
 perform private.exigir_acceso(p_proyecto_id,true); perform private.proyecto_abierto(p_proyecto_id);
 select * into t from public.tipo_metrica where id=p_tipo_id and activa; if not found then perform private.fallar('DATOS_INVALIDOS'); end if;
 perform private.validar_objetivo(t.codigo,p_objetivo,p_objetivo_critico);
 insert into public.metrica_proyecto(proyecto_id,tipo_metrica_id,operador,objetivo,objetivo_critico,configurada_por) values(p_proyecto_id,t.id,case when t.codigo='M-04' then '<=' else '>=' end,p_objetivo,p_objetivo_critico,auth.uid()) returning id into mid;
 return private.metrica_json(mid); exception when unique_violation then perform private.fallar('CONFLICTO'); end $$;
create function public.configurar_objetivo(p_metrica_proyecto_id uuid,p_configurada_en_esperada timestamptz,p_objetivo numeric,p_objetivo_critico numeric default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.metrica_proyecto; c text; begin
 select * into m from public.metrica_proyecto where id=p_metrica_proyecto_id; perform private.exigir_acceso(m.proyecto_id,true); perform private.proyecto_abierto(m.proyecto_id);
 select * into m from public.metrica_proyecto where id=p_metrica_proyecto_id for update;
 if p_configurada_en_esperada is null or m.configurada_en<>p_configurada_en_esperada then perform private.fallar('CONFLICTO'); end if;
 select codigo into c from public.tipo_metrica where id=m.tipo_metrica_id; perform private.validar_objetivo(c,p_objetivo,p_objetivo_critico);
 update public.metrica_proyecto set objetivo=p_objetivo,objetivo_critico=p_objetivo_critico,configurada_por=auth.uid(),configurada_en=greatest(clock_timestamp(),m.configurada_en+interval '1 microsecond') where id=m.id;
 return private.metrica_json(m.id); end $$;
create function public.registrar_medicion(p_medicion_id uuid,p_metrica_proyecto_id uuid,p_medida_en timestamptz,p_datos_fuente jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.metrica_proyecto; original public.medicion; r public.revision_medicion; c text; v numeric; reused boolean:=false; begin
 select * into m from public.metrica_proyecto where id=p_metrica_proyecto_id; perform private.exigir_acceso(m.proyecto_id,true); perform private.proyecto_abierto(m.proyecto_id);
 if p_medicion_id is null or p_medida_en is null then perform private.fallar('DATOS_INVALIDOS'); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_medicion_id::text,0));
 select * into original from public.medicion where id=p_medicion_id;
 if found then
  select * into r from public.revision_medicion where medicion_id=p_medicion_id and numero_revision=1;
  if original.metrica_proyecto_id<>m.id or original.creada_por<>auth.uid() or original.medida_en<>p_medida_en or r.datos_fuente<>p_datos_fuente then perform private.fallar('CONFLICTO'); end if;
  reused:=true;
 else
  select codigo into c from public.tipo_metrica where id=m.tipo_metrica_id; v:=private.calcular(c,p_datos_fuente);
  insert into public.medicion(id,metrica_proyecto_id,medida_en,creada_por) values(p_medicion_id,m.id,p_medida_en,auth.uid());
  insert into public.revision_medicion(medicion_id,numero_revision,datos_fuente,valor,condicion,causa_no_evaluable,autor_id) values(p_medicion_id,1,p_datos_fuente,v,case when v is null then 'No evaluable' else 'Evaluable' end,case when v is null then 'Denominador cero' end,auth.uid());
 end if;
 select * into r from public.revision_medicion where medicion_id=p_medicion_id order by numero_revision desc limit 1;
 return jsonb_build_object('id',p_medicion_id,'revisionActual',r.numero_revision,'valor',r.valor::text,'reutilizada',reused,'metrica',private.metrica_json(m.id)); end $$;
create function public.corregir_medicion(p_medicion_id uuid,p_revision_esperada integer,p_datos_fuente jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare med public.medicion; m public.metrica_proyecto; rev integer; c text; v numeric; begin
 select * into med from public.medicion where id=p_medicion_id; select * into m from public.metrica_proyecto where id=med.metrica_proyecto_id;
 perform private.exigir_acceso(m.proyecto_id,true); perform private.proyecto_abierto(m.proyecto_id);
 perform 1 from public.medicion where id=p_medicion_id for update;
 select max(numero_revision) into rev from public.revision_medicion where medicion_id=p_medicion_id;
 if p_revision_esperada is null or rev<>p_revision_esperada then perform private.fallar('CONFLICTO'); end if;
 select codigo into c from public.tipo_metrica where id=m.tipo_metrica_id; v:=private.calcular(c,p_datos_fuente);
 insert into public.revision_medicion(medicion_id,numero_revision,datos_fuente,valor,condicion,causa_no_evaluable,autor_id) values(p_medicion_id,rev+1,p_datos_fuente,v,case when v is null then 'No evaluable' else 'Evaluable' end,case when v is null then 'Denominador cero' end,auth.uid());
 return jsonb_build_object('id',p_medicion_id,'revisionActual',rev+1,'valor',v::text,'metrica',private.metrica_json(m.id)); end $$;
commit;
