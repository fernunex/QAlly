-- Modelo aprobado por ADR-001/002. Sin acceso de escritura directo de usuarios.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;

create table public.perfil (
 usuario_id uuid primary key references auth.users(id) on delete restrict,
 nombre varchar(120) not null check (length(btrim(nombre)) > 0),
 rol text not null check (rol in ('QA','Miembro del equipo'))
);
create table public.etapa (
 codigo varchar(16) primary key check (codigo in ('requerimientos','diseno','desarrollo')),
 nombre varchar(80) not null unique, orden smallint not null unique check (orden between 1 and 3)
);
create table public.tipo_actividad (
 id uuid primary key default gen_random_uuid(), codigo varchar(16) not null unique,
 nombre varchar(200) not null check (length(btrim(nombre))>0),
 descripcion varchar(5000) not null check (length(btrim(descripcion))>0),
 etapa_codigo varchar(16) not null references public.etapa(codigo),
 activa boolean not null default true, preseleccionada boolean not null default false
);
create table public.tipo_metrica (
 id uuid primary key default gen_random_uuid(), codigo varchar(16) not null unique,
 nombre varchar(200) not null, etapa_codigo varchar(16) not null references public.etapa(codigo),
 unidad varchar(20) not null, definicion_clave varchar(64) not null unique, activa boolean not null default true
);
create table public.proyecto (
 id uuid primary key default gen_random_uuid(), nombre varchar(200) not null check(length(btrim(nombre))>0),
 descripcion varchar(5000) not null check(length(btrim(descripcion))>0), periodo_academico varchar(40),
 fecha_inicio date not null, fecha_fin_prevista date,
 creado_por uuid not null references public.perfil(usuario_id), creado_en timestamptz not null default clock_timestamp(),
 actualizado_en timestamptz not null default clock_timestamp(), cerrado_por uuid references public.perfil(usuario_id), cerrado_en timestamptz,
 version bigint not null default 1 check(version>0), solicitud_creacion_id uuid not null,
 solicitud_creacion_hash char(64) not null check(solicitud_creacion_hash ~ '^[a-f0-9]{64}$'),
 unique(creado_por,solicitud_creacion_id),
 check(fecha_fin_prevista is null or fecha_fin_prevista>=fecha_inicio), check((cerrado_en is null)=(cerrado_por is null))
);
create table public.participacion_proyecto (
 proyecto_id uuid not null references public.proyecto(id), usuario_id uuid not null references public.perfil(usuario_id),
 asociada_en timestamptz not null default clock_timestamp(), primary key(proyecto_id,usuario_id)
);
create table public.actividad_sqa (
 id uuid primary key default gen_random_uuid(), proyecto_id uuid not null references public.proyecto(id),
 tipo_actividad_id uuid not null references public.tipo_actividad(id), descripcion varchar(5000) not null check(length(btrim(descripcion))>0),
 responsable_id uuid, estado text not null default 'Pendiente' check(estado in ('Pendiente','En progreso','En revisión','Aprobada')),
 creado_por uuid not null references public.perfil(usuario_id), creado_en timestamptz not null default clock_timestamp(),
 version bigint not null default 1 check(version>0),
 foreign key(proyecto_id,responsable_id) references public.participacion_proyecto(proyecto_id,usuario_id),
 check(estado='Pendiente' or responsable_id is not null)
);
create table public.entrega (
 id uuid primary key default gen_random_uuid(), actividad_id uuid not null references public.actividad_sqa(id),
 numero_intento integer not null check(numero_intento>0), resultado varchar(20000), autor_id uuid not null references public.perfil(usuario_id),
 creada_en timestamptz not null default clock_timestamp(), enviada_en timestamptz,
 unique(actividad_id,numero_intento), check(enviada_en is null or length(btrim(resultado))>0 and resultado is not null)
);
create unique index entrega_borrador_unico on public.entrega(actividad_id) where enviada_en is null;
create table public.archivo_evidencia (
 id uuid primary key default gen_random_uuid(), proyecto_id uuid not null references public.proyecto(id),
 entrega_origen_id uuid not null references public.entrega(id), creado_por uuid not null references public.perfil(usuario_id),
 ruta_objeto varchar(255) not null unique, nombre_archivo varchar(255) not null,
 mime_type varchar(40) not null check(mime_type='application/pdf'), tamano_bytes bigint not null check(tamano_bytes between 1 and 3145728),
 sha256 char(64) not null check(sha256 ~ '^[a-f0-9]{64}$'),
 estado text not null default 'Reservado' check(estado in ('Reservado','Disponible','Eliminando','Eliminado')),
 creado_en timestamptz not null default clock_timestamp(), actualizado_en timestamptz not null default clock_timestamp(),
 reserva_hasta timestamptz not null default (clock_timestamp()+interval '30 minutes'), sin_referencias_desde timestamptz default clock_timestamp(),
 check(ruta_objeto=proyecto_id::text||'/'||id::text||'.pdf'),
 check(nombre_archivo<>'' and nombre_archivo !~ '[/\\\x00-\x1f]')
);
create table public.evidencia (
 id uuid primary key default gen_random_uuid(), entrega_id uuid not null references public.entrega(id),
 tipo text not null check(tipo in ('PDF','Enlace')), archivo_id uuid references public.archivo_evidencia(id),
 url varchar(2048), autor_id uuid not null references public.perfil(usuario_id), creada_en timestamptz not null default clock_timestamp(),
 check((tipo='PDF' and archivo_id is not null and url is null) or
       (tipo='Enlace' and archivo_id is null and url is not null and url ~* '^https?://[^[:space:]/?#]+[^[:space:]]*$'))
);
create table public.revision_entrega (
 id uuid primary key default gen_random_uuid(), entrega_id uuid not null unique references public.entrega(id),
 decision text not null check(decision in ('Aprobar','Devolver')), observaciones varchar(10000),
 qa_id uuid not null references public.perfil(usuario_id), revisada_en timestamptz not null default clock_timestamp(),
 check(decision<>'Devolver' or observaciones is not null and length(btrim(observaciones))>0)
);
create table public.metrica_proyecto (
 id uuid primary key default gen_random_uuid(), proyecto_id uuid not null references public.proyecto(id),
 tipo_metrica_id uuid not null references public.tipo_metrica(id), operador text not null check(operador in ('>=','<=')),
 objetivo numeric(20,8) not null, objetivo_critico numeric(20,8),
 configurada_por uuid not null references public.perfil(usuario_id), configurada_en timestamptz not null default clock_timestamp(),
 unique(proyecto_id,tipo_metrica_id)
);
create table public.medicion (
 id uuid primary key, metrica_proyecto_id uuid not null references public.metrica_proyecto(id), medida_en timestamptz not null,
 orden_registro bigint generated always as identity unique, creada_por uuid not null references public.perfil(usuario_id), creada_en timestamptz not null default clock_timestamp()
);
create table public.revision_medicion (
 medicion_id uuid not null references public.medicion(id), numero_revision integer not null check(numero_revision>0),
 datos_fuente jsonb not null check(jsonb_typeof(datos_fuente)='object'), valor numeric(20,8),
 condicion text not null check(condicion in ('Evaluable','No evaluable')), causa_no_evaluable varchar(200),
 autor_id uuid not null references public.perfil(usuario_id), registrada_en timestamptz not null default clock_timestamp(),
 primary key(medicion_id,numero_revision),
 check((condicion='Evaluable' and valor is not null and causa_no_evaluable is null) or
       (condicion='No evaluable' and valor is null and length(btrim(causa_no_evaluable))>0 and causa_no_evaluable is not null))
);
create index participacion_usuario on public.participacion_proyecto(usuario_id,proyecto_id);
create index actividad_proyecto_estado on public.actividad_sqa(proyecto_id,estado);
create index actividad_responsable on public.actividad_sqa(responsable_id,proyecto_id,estado);
create index actividad_tipo on public.actividad_sqa(tipo_actividad_id);
create index evidencia_entrega on public.evidencia(entrega_id);
create index evidencia_archivo on public.evidencia(archivo_id);
create index archivo_limpieza on public.archivo_evidencia(estado,sin_referencias_desde,reserva_hasta);
create index medicion_vigente on public.medicion(metrica_proyecto_id,medida_en desc,orden_registro desc);
create index metrica_tipo on public.metrica_proyecto(tipo_metrica_id);

-- RLS desde la primera migración, sin ventana de acceso público.
do $$ declare t text; begin
 foreach t in array array['perfil','etapa','tipo_actividad','tipo_metrica','proyecto','participacion_proyecto','actividad_sqa','entrega','archivo_evidencia','evidencia','revision_entrega','metrica_proyecto','medicion','revision_medicion'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on all sequences in schema public to service_role;
commit;
