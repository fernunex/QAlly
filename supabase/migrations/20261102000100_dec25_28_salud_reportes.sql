-- DEC-25..28 (2026-10-30) y DEC-29..31 (RQ-01..03, 2026-11-02). Diseño: docs/decisiones/ADR-003-salud-y-reporte.md.
-- Sustituye funciones existentes con create or replace (se conservan sus permisos) y actualiza
-- datos de referencia. No cambia tablas ni columnas.
begin;

-- DEC-25: nombres ratificados y las diez actividades preseleccionadas (desmarcables en CU-01).
update public.tipo_actividad t set nombre=v.nombre,preseleccionada=true
from (values
 ('A-01','Revisión de documentación de requisitos'),('A-02','Trazabilidad de requerimientos'),
 ('A-03','Revisión de documentación de diseño'),('A-04','Trazabilidad de diseño'),
 ('A-05','Análisis estático automático de código'),('A-06','Revisión por pares (Code Review)'),
 ('A-07','Administración de cambios de repositorio'),('A-08','Revisión personal de código'),
 ('A-09','Realizar pruebas (Testing)'),('A-10','Trazabilidad de pruebas')) as v(codigo,nombre)
where t.codigo=v.codigo;

-- DEC-29 (RQ-01): objetivos porcentuales en (0,100]. Las metas 0 existentes no se reescriben:
-- la salud las trata como No evaluables (private.aporte_metrica). M-04 conserva [0, 2e9].
-- M-01 conserva objetivo_critico (criterio independiente, DEC-26); 0 sigue permitido allí
-- porque no participa en la salud.
create or replace function private.validar_objetivo(p_codigo text,p_obj numeric,p_crit numeric) returns void language plpgsql set search_path='' as $$
begin
 if p_obj is null or p_obj::text in ('NaN','Infinity','-Infinity') or p_crit::text in ('NaN','Infinity','-Infinity') then perform private.fallar('DATOS_INVALIDOS'); end if;
 if p_codigo in ('M-01','M-02','M-03') then
  if p_obj<=0 or p_obj>100 or p_obj<>trunc(p_obj,4) then perform private.fallar('DATOS_INVALIDOS'); end if;
 elsif p_codigo='M-04' then
  if p_obj<0 or p_obj>2000000000 or p_obj<>trunc(p_obj) then perform private.fallar('DATOS_INVALIDOS'); end if;
 else perform private.fallar('DATOS_INVALIDOS'); end if;
 if p_codigo='M-01' then
  if p_crit is null or p_crit<0 or p_crit>100 or p_crit<>trunc(p_crit,4) then perform private.fallar('DATOS_INVALIDOS'); end if;
 elsif p_crit is not null then perform private.fallar('DATOS_INVALIDOS'); end if;
end $$;

-- DEC-26: fuente_referencia opcional. Si viene, texto de 1 a 2048 caracteres; las demás claves
-- siguen siendo exactamente las del catálogo.
create or replace function private.calcular(p_codigo text,p_datos jsonb) returns numeric language plpgsql immutable set search_path='' as $$
declare claves text[]; k text; v numeric; n numeric; d numeric; ca numeric; ce numeric; con_fuente boolean; begin
 if jsonb_typeof(p_datos) is distinct from 'object' then perform private.fallar('DATOS_INVALIDOS'); end if;
 claves:=case p_codigo when 'M-01' then array['aprobadas','ejecutadas','criticas_aprobadas','criticas_ejecutadas'] when 'M-02' then array['integrados_revisados','integrados'] when 'M-03' then array['requisitos_probados','requisitos_definidos'] when 'M-04' then array['criticos_abiertos','altos_abiertos'] else null end;
 con_fuente:=p_datos ? 'fuente_referencia';
 if claves is null or (select count(*) from jsonb_object_keys(p_datos))<>cardinality(claves)+(case when con_fuente then 1 else 0 end)
 or con_fuente and (jsonb_typeof(p_datos->'fuente_referencia') is distinct from 'string' or length(btrim(p_datos->>'fuente_referencia')) not between 1 and 2048) then perform private.fallar('DATOS_INVALIDOS'); end if;
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

-- Última revisión de la medición vigente (fecha medida DESC, orden de registro DESC).
create function private.revision_vigente(p_metrica uuid) returns public.revision_medicion language sql stable set search_path='' as $$
 select r.* from public.medicion m join public.revision_medicion r on r.medicion_id=m.id
 where m.metrica_proyecto_id=p_metrica order by m.medida_en desc,m.orden_registro desc,r.numero_revision desc limit 1 $$;

-- Numerador/denominador del valor principal de M-01..M-03 (sin redondear).
create function private.fraccion(p_codigo text,p_datos jsonb,out n numeric,out d numeric) language sql immutable set search_path='' as $$
 select case p_codigo when 'M-01' then (p_datos->>'aprobadas')::numeric when 'M-02' then (p_datos->>'integrados_revisados')::numeric else (p_datos->>'requisitos_probados')::numeric end,
        case p_codigo when 'M-01' then (p_datos->>'ejecutadas')::numeric when 'M-02' then (p_datos->>'integrados')::numeric else (p_datos->>'requisitos_definidos')::numeric end $$;

-- DEC-27: aporte C_i ∈ [0,1] de una métrica seleccionada, con 40 decimales (sin redondeo de
-- pantalla). NULL = no aporta por falta de datos (Sin medición, No evaluable o meta 0 % heredada):
-- quien llama suma 0 y la conserva en el denominador. DEC-30 (RQ-02): una revisión Evaluable sin
-- valor u objetivo viola las restricciones del esquema y se rechaza como error, no como dato.
create function private.aporte_metrica(p_metrica uuid) returns numeric language plpgsql stable set search_path='' as $$
declare m public.metrica_proyecto; c text; r public.revision_medicion; f record; obj numeric; begin
 select * into m from public.metrica_proyecto where id=p_metrica;
 select codigo into c from public.tipo_metrica where id=m.tipo_metrica_id;
 r:=private.revision_vigente(p_metrica);
 if r.medicion_id is null or r.condicion<>'Evaluable' then return null; end if;
 if r.valor is null or m.objetivo is null then perform private.fallar('FALLO_PERSISTENCIA'); end if;
 obj:=m.objetivo::numeric(60,40);
 if c='M-04' then
  if r.valor<=m.objetivo then return 1; end if;
  return obj/r.valor;  -- objetivo 0 con valor > 0 resulta 0
 end if;
 if m.objetivo<=0 then return null; end if;  -- DEC-29: meta 0 % heredada, No evaluable para salud
 select * into f from private.fraccion(c,r.datos_fuente);
 return least(1,(100*f.n)::numeric(60,40)/(f.d*obj));
end $$;

-- DEC-26: M-01 cumple o incumple solo con su valor general; el criterio de críticas se informa
-- aparte en cumplimientoCritico. Se agrega aporte (8 decimales, solo para mostrar).
create or replace function private.metrica_json(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare m public.metrica_proyecto; t public.tipo_metrica; med public.medicion; r public.revision_medicion; f record;
 cv numeric; cumplimiento text:='No evaluable'; critica text:='Sin medición'; cumple_critico text:='Sin medición'; cumple boolean; aporte numeric;
begin
 select * into m from public.metrica_proyecto where id=p_id; select * into t from public.tipo_metrica where id=m.tipo_metrica_id;
 r:=private.revision_vigente(p_id);
 select * into med from public.medicion where id=r.medicion_id;
 if r.condicion='Evaluable' then
  if t.codigo='M-04' then cumple:=r.valor<=m.objetivo;
  else select * into f from private.fraccion(t.codigo,r.datos_fuente); cumple:=100*f.n>=m.objetivo*f.d; end if;
  cumplimiento:=case when cumple then 'Cumple' else 'Incumple' end;
 end if;
 if t.codigo='M-01' and r.medicion_id is not null then
  if (r.datos_fuente->>'criticas_ejecutadas')::numeric=0 then critica:='No evaluable'; cumple_critico:='No evaluable';
  else
   cv:=round(100*(r.datos_fuente->>'criticas_aprobadas')::numeric/(r.datos_fuente->>'criticas_ejecutadas')::numeric,8); critica:='Evaluable';
   cumple_critico:=case when 100*(r.datos_fuente->>'criticas_aprobadas')::numeric>=m.objetivo_critico*(r.datos_fuente->>'criticas_ejecutadas')::numeric then 'Cumple' else 'Incumple' end;
  end if;
 end if;
 aporte:=private.aporte_metrica(p_id);
 return jsonb_build_object('id',m.id,'proyectoId',m.proyecto_id,'tipo',jsonb_build_object('id',t.id,'codigo',t.codigo,'nombre',t.nombre,'etapaCodigo',t.etapa_codigo,'unidad',t.unidad),
 'operador',m.operador,'objetivo',m.objetivo::text,'objetivoCritico',m.objetivo_critico::text,'valorActual',r.valor::text,
 'condicionPrincipal',coalesce(r.condicion,'Sin medición'),'causa',r.causa_no_evaluable,'cumplimiento',cumplimiento,
 'valorCritico',cv::text,'condicionCritica',case when t.codigo='M-01' then critica else 'Sin medición' end,
 'causaCritica',case when t.codigo='M-01' and critica='No evaluable' then 'Sin muestra crítica' end,
 'cumplimientoCritico',case when t.codigo='M-01' then cumple_critico end,
 'aporte',round(aporte,8)::text,
 'medidaEn',med.medida_en,'configuradaEn',m.configurada_en);
end $$;

-- DEC-27: S = 100 × (A + Σ C_i) / (N_A + N_M) sobre el proyecto (p_etapa NULL) o una etapa.
-- La clasificación usa S con 20 decimales; porcentaje es S redondeado a 2 para pantalla.
-- Advertencias: SIN_ELEMENTOS, EVALUACION_PARCIAL, SIN_AVANCE (0 % sin aprobadas ni
-- mediciones evaluables) y DEFECTOS_GRAVES (M-04 vigente > 0; sin tope de puntuación).
create function private.salud_json(p_proyecto uuid,p_etapa text default null) returns jsonb language plpgsql stable set search_path='' as $$
declare na integer; aa integer; nm integer:=0; sin_datos integer:=0; suma numeric:=0; defectos boolean:=false; x record; c numeric; s numeric; adv text[]:='{}'; clase text; begin
 select count(*),count(*) filter (where a.estado='Aprobada') into na,aa from public.actividad_sqa a join public.tipo_actividad t on t.id=a.tipo_actividad_id
 where a.proyecto_id=p_proyecto and (p_etapa is null or t.etapa_codigo=p_etapa);
 for x in select mp.id,t.codigo from public.metrica_proyecto mp join public.tipo_metrica t on t.id=mp.tipo_metrica_id
  where mp.proyecto_id=p_proyecto and (p_etapa is null or t.etapa_codigo=p_etapa) order by t.codigo loop
  nm:=nm+1; c:=private.aporte_metrica(x.id);
  if c is null then sin_datos:=sin_datos+1; else suma:=suma+c; end if;
  if x.codigo='M-04' and (select r.condicion='Evaluable' and r.valor>0 from private.revision_vigente(x.id) r) then defectos:=true; end if;
 end loop;
 if sin_datos>0 then adv:=array_append(adv,'EVALUACION_PARCIAL'); end if;
 if defectos then adv:=array_append(adv,'DEFECTOS_GRAVES'); end if;
 if na+nm=0 then
  return jsonb_build_object('estado','Sin evaluar','porcentaje',null,'clasificacion',null,'puntos','0','posibles',0,
   'actividades',jsonb_build_object('total',0,'aprobadas',0),'metricas',jsonb_build_object('total',0,'sinDatos',0),'advertencias',to_jsonb(array['SIN_ELEMENTOS']));
 end if;
 if aa=0 and sin_datos=nm then adv:=array_append(adv,'SIN_AVANCE'); end if;
 s:=round(100*(aa+suma)::numeric(60,40)/(na+nm),20);
 clase:=case when s<50 then 'Malo' when s<70 then 'Regular' when s<90 then 'Bueno' else 'Excelente' end;
 return jsonb_build_object('estado','Evaluada','porcentaje',round(s,2)::text,'clasificacion',clase,'puntos',trim_scale(round(aa+suma,4))::text,'posibles',na+nm,
  'actividades',jsonb_build_object('total',na,'aprobadas',aa),'metricas',jsonb_build_object('total',nm,'sinDatos',sin_datos),'advertencias',to_jsonb(adv));
end $$;

-- Evidencias del último intento enviado de una actividad (DEC-28). Solo referencias: nombre del
-- PDF (se descarga por la ruta autorizada de evidencias) o URL del enlace.
create function private.evidencias_json(p_actividad uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',ev.id,'tipo',ev.tipo,'nombre',f.nombre_archivo,'url',ev.url) order by ev.creada_en,ev.id),'[]')
 from public.evidencia ev left join public.archivo_evidencia f on f.id=ev.archivo_id
 where ev.entrega_id=(select e.id from public.entrega e where e.actividad_id=p_actividad and e.enviada_en is not null order by e.numero_intento desc limit 1) $$;

-- Resumen compartido por CU-05 y CU-06: salud calculada, instancia por tipo y evidencias.
create or replace function public.consultar_resumen(p_proyecto_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin perform private.exigir_acceso(p_proyecto_id);
 return (select jsonb_build_object('proyecto',jsonb_build_object('id',p.id,'nombre',p.nombre,'descripcion',p.descripcion,'periodoAcademico',p.periodo_academico,'fechaInicio',p.fecha_inicio,'fechaFinPrevista',p.fecha_fin_prevista,'cerradoEn',p.cerrado_en),'generadoEn',statement_timestamp(),
 'salud',private.salud_json(p.id),
 'etapas',(select jsonb_agg(jsonb_build_object('codigo',et.codigo,'nombre',et.nombre,'salud',private.salud_json(p.id,et.codigo),
 'conteos',(select jsonb_object_agg(s.estado,(select count(*) from public.actividad_sqa a join public.tipo_actividad t on t.id=a.tipo_actividad_id where a.proyecto_id=p.id and t.etapa_codigo=et.codigo and a.estado=s.estado)) from unnest(array['Pendiente','En progreso','En revisión','Aprobada']) as s(estado)),
 'actividades',(select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'tipoCodigo',x.codigo,'tipoNombre',x.nombre,'instancia',x.instancia,'responsableNombre',x.responsable,'estado',x.estado,'evidencias',private.evidencias_json(x.id)) order by x.creado_en,x.id),'[]')
  from (select a.id,a.creado_en,a.estado,t.codigo,t.nombre,pf.nombre as responsable,row_number() over (partition by a.tipo_actividad_id order by a.creado_en,a.id) as instancia
   from public.actividad_sqa a join public.tipo_actividad t on t.id=a.tipo_actividad_id left join public.perfil pf on pf.usuario_id=a.responsable_id
   where a.proyecto_id=p.id and t.etapa_codigo=et.codigo) x)) order by et.orden) from public.etapa et),
 'metricas',(select coalesce(jsonb_agg(private.metrica_json(m.id) order by t.codigo),'[]') from public.metrica_proyecto m join public.tipo_metrica t on t.id=m.tipo_metrica_id where m.proyecto_id=p.id)) from public.proyecto p where p.id=p_proyecto_id);
end $$;

-- Salud general de varios proyectos (listado y encabezado). Solo los autorizados: los demás
-- identificadores se omiten sin revelar si existen. Máximo 100 por llamada.
create function public.consultar_salud(p_proyecto_ids uuid[]) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin perform private.exigir_sesion();
 if p_proyecto_ids is null or cardinality(p_proyecto_ids)>100 then perform private.fallar('DATOS_INVALIDOS'); end if;
 return (select coalesce(jsonb_object_agg(p.id,private.salud_json(p.id)),'{}') from public.proyecto p where p.id=any(p_proyecto_ids) and private.participa(p.id));
end $$;
revoke all on function public.consultar_salud(uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.consultar_salud(uuid[]) to authenticated;

notify pgrst, 'reload schema';
commit;
