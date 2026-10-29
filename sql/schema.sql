-- =====================================================================
-- Esquema completo de la plataforma (Supabase / Postgres)
-- Proyecto: https://glojhiyloyoeqyasugmu.supabase.co
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Después ejecutar sql/usuarios_propios.sql (usuarios en tabla propia, sin Supabase Auth).
--
-- ⚠️ La sección 0 BORRA las tablas existentes y sus datos.
--    Coméntala si solo quieres crear lo que falta.
-- =====================================================================

-- 0. Limpieza ----------------------------------------------------------
drop table if exists public.progreso_evaluacion cascade;
drop table if exists public.progreso_modulo     cascade;
drop table if exists public.progreso            cascade;
drop table if exists public.evaluaciones        cascade;
drop table if exists public.modulos             cascade;
drop table if exists public.cursos              cascade;
drop table if exists public.perfiles            cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.protect_profile_fields() cascade;

-- 1. Tablas ------------------------------------------------------------

-- Perfil de cada usuario de Supabase Auth
create table public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  nombre      text,
  email       text,
  ci          text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  role_label  text default 'Scout de Tropa',
  avatar      text,
  status      text default 'Activo',
  created_at  timestamptz not null default now()
);

create table public.cursos (
  id          bigint generated always as identity primary key,
  titulo      text not null,
  descripcion text,
  duracion    text,
  imagen_url  text,
  badge       text,
  category    text,
  -- alias usados en algunas pantallas
  title       text,
  summary     text,
  cover_image text,
  created_at  timestamptz not null default now()
);

create table public.modulos (
  id          bigint generated always as identity primary key,
  curso_id    bigint not null references public.cursos(id) on delete cascade,
  title       text not null,
  duration    text,
  content     text,          -- JSON (string) con los bloques del módulo
  contenido   text,          -- alias legado
  quiz        text default '[]',
  tipo        text not null default 'regular' check (tipo in ('regular', 'intro')),
  orden       integer not null default 1,
  created_at  timestamptz not null default now()
);
create index modulos_curso_orden_idx on public.modulos (curso_id, orden);

create table public.evaluaciones (
  id          bigint generated always as identity primary key,
  modulo_id   bigint not null references public.modulos(id) on delete cascade,
  titulo      text,
  min_score   integer not null default 70,
  preguntas   jsonb not null default '[]'::jsonb,
  orden       integer not null default 1,
  created_at  timestamptz not null default now()
);
create index evaluaciones_modulo_idx on public.evaluaciones (modulo_id, orden);

create table public.progreso_modulo (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  modulo_id   bigint not null references public.modulos(id) on delete cascade,
  completado  boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (user_id, modulo_id)
);
create index progreso_modulo_modulo_idx on public.progreso_modulo (modulo_id);

create table public.progreso_evaluacion (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  evaluacion_id bigint not null references public.evaluaciones(id) on delete cascade,
  score         numeric,
  aprobado      boolean not null default false,
  updated_at    timestamptz not null default now()
);
create index progreso_evaluacion_user_idx on public.progreso_evaluacion (user_id);
create index progreso_evaluacion_eval_idx on public.progreso_evaluacion (evaluacion_id);

-- 2. Helper de rol -----------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- 2b. Crear el perfil automáticamente al registrarse ------------------
-- Siempre con rol 'user'; un admin lo promueve después desde la app.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1));
begin
  insert into public.perfiles (id, name, email, ci, role, role_label, avatar)
  values (
    new.id,
    v_name,
    new.email,
    nullif(trim(new.raw_user_meta_data->>'ci'), ''),
    'user',
    'Scout de Tropa',
    upper(left(regexp_replace(initcap(v_name), '[^A-ZÁÉÍÓÚÑ]', '', 'g'), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuarios que ya existían en Auth antes de este script
insert into public.perfiles (id, name, email, ci, role, role_label, avatar)
select u.id, n.name, u.email, nullif(trim(u.raw_user_meta_data->>'ci'), ''),
       'user', 'Scout de Tropa',
       upper(left(regexp_replace(initcap(n.name), '[^A-ZÁÉÍÓÚÑ]', '', 'g'), 2))
from auth.users u
cross join lateral (
  select coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)) as name
) n
on conflict (id) do nothing;

-- Solo un admin puede cambiar rol, etiqueta, correo o estado de un perfil.
-- auth.uid() es null en el SQL Editor, así que ahí sí se permite.
create function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.role       := old.role;
    new.role_label := old.role_label;
    new.email      := old.email;
    new.status     := old.status;
  end if;
  return new;
end;
$$;

create trigger perfiles_protect_fields
  before update on public.perfiles
  for each row execute function public.protect_profile_fields();

-- 3. RLS ---------------------------------------------------------------
alter table public.perfiles            enable row level security;
alter table public.cursos              enable row level security;
alter table public.modulos             enable row level security;
alter table public.evaluaciones        enable row level security;
alter table public.progreso_modulo     enable row level security;
alter table public.progreso_evaluacion enable row level security;

-- perfiles: cada uno ve/edita el suyo; admin ve/gestiona todos
create policy perfiles_select on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
-- Los perfiles los crea el trigger handle_new_user (sección 2b); el cliente no inserta.
-- Un usuario normal puede editar su perfil; el trigger protect_profile_fields
-- impide que se cambie el rol, la etiqueta, el correo o el estado.
create policy perfiles_update on public.perfiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
create policy perfiles_delete on public.perfiles for delete to authenticated
  using (public.is_admin());

-- contenido (cursos, módulos, evaluaciones): lectura para autenticados, escritura solo admin
create policy cursos_select on public.cursos for select to authenticated using (true);
create policy cursos_write  on public.cursos for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy modulos_select on public.modulos for select to authenticated using (true);
create policy modulos_write  on public.modulos for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy evaluaciones_select on public.evaluaciones for select to authenticated using (true);
create policy evaluaciones_write  on public.evaluaciones for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- progreso: cada usuario el suyo; admin puede leer todo
create policy progreso_modulo_own on public.progreso_modulo for all to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()));

create policy progreso_evaluacion_own on public.progreso_evaluacion for all to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()));

-- 4. Storage (bucket "bucket", usado para PDFs/PPTX/imágenes de módulos) --
-- El código usa getPublicUrl(), así que el bucket debe ser público para lectura.
insert into storage.buckets (id, name, public)
values ('bucket', 'bucket', true)
on conflict (id) do update set public = true;

drop policy if exists bucket_select on storage.objects;
drop policy if exists bucket_insert on storage.objects;
drop policy if exists bucket_update on storage.objects;
drop policy if exists bucket_delete on storage.objects;

create policy bucket_select on storage.objects for select
  using (bucket_id = 'bucket');
create policy bucket_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'bucket' and public.is_admin());
create policy bucket_update on storage.objects for update to authenticated
  using (bucket_id = 'bucket' and public.is_admin());
create policy bucket_delete on storage.objects for delete to authenticated
  using (bucket_id = 'bucket' and public.is_admin());

-- 5. Primer administrador ----------------------------------------------
-- Después de registrarte en la app, ejecuta (cambiando el correo):
-- update public.perfiles set role = 'admin', role_label = 'Administrador / Dirigente'
-- where email = 'tu-correo@ejemplo.com';
