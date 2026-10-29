-- =====================================================================
-- Usuarios en tabla propia (sin Supabase Auth)
-- Ejecutar en: Supabase → SQL Editor, DESPUÉS de schema.sql.
-- No borra cursos ni progreso. Se puede ejecutar más de una vez.
--
-- Cómo funciona:
--  * public.usuarios guarda los usuarios con la contraseña cifrada (bcrypt).
--  * Al iniciar sesión, la función iniciar_sesion() devuelve un token que
--    se guarda en public.sesiones.
--  * La app envía ese token en la cabecera "x-session-token" en cada
--    petición; usuario_actual_id() lo lee y las reglas RLS lo usan en
--    lugar de auth.uid().
--  * La vista public.perfiles expone los usuarios SIN la contraseña.
--  * Los usuarios que ya existían en Supabase Auth se copian con la misma
--    contraseña (Auth ya la guarda en bcrypt).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1. Tablas ------------------------------------------------------------
create table if not exists public.usuarios (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  password_hash text not null,
  ci            text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  role_label    text default 'Scout de Tropa',
  avatar        text,
  status        text default 'Activo',
  created_at    timestamptz not null default now()
);
create unique index if not exists usuarios_email_key on public.usuarios (lower(email));

create table if not exists public.sesiones (
  token       text primary key default encode(extensions.gen_random_bytes(32), 'hex'),
  usuario_id  uuid not null references public.usuarios(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 days'
);
create index if not exists sesiones_usuario_idx on public.sesiones (usuario_id);

alter table public.usuarios enable row level security;
alter table public.sesiones enable row level security;

-- Nadie lee las sesiones ni las contraseñas directamente por la API
revoke all on public.sesiones from anon, authenticated;
revoke all on public.usuarios from anon, authenticated;
grant select (id, name, email, ci, role, role_label, avatar, status, created_at) on public.usuarios to anon, authenticated;
grant update (name, ci, avatar, role, role_label, status) on public.usuarios to anon, authenticated;
grant delete on public.usuarios to anon, authenticated;

-- 2. Copiar los usuarios que ya existían en Supabase Auth ---------------
do $$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relname = 'perfiles' and c.relkind = 'r') then
    -- Con la tabla perfiles antigua: conservar nombre, rol, cédula, etc.
    execute $sql$
      insert into public.usuarios (id, name, email, password_hash, ci, role, role_label, avatar, status, created_at)
      select u.id,
             coalesce(p.name, u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
             u.email, u.encrypted_password, p.ci,
             coalesce(p.role, 'user'), coalesce(p.role_label, 'Scout de Tropa'),
             p.avatar, coalesce(p.status, 'Activo'), u.created_at
      from auth.users u
      left join public.perfiles p on p.id = u.id
      where u.email is not null and coalesce(u.encrypted_password, '') <> ''
      on conflict do nothing
    $sql$;
    drop table public.perfiles cascade;
  else
    insert into public.usuarios (id, name, email, password_hash, created_at)
    select u.id, coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
           u.email, u.encrypted_password, u.created_at
    from auth.users u
    where u.email is not null and coalesce(u.encrypted_password, '') <> ''
    on conflict do nothing;
  end if;
end $$;

-- Ya no se crean perfiles desde Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.protect_profile_fields() cascade;
drop table if exists public.progreso cascade;

-- Columna que usa el administrador de cursos (por si falta)
alter table public.modulos add column if not exists tipo text not null default 'regular';

-- 3. El progreso ahora apunta a usuarios --------------------------------
delete from public.progreso_modulo pm where not exists (select 1 from public.usuarios u where u.id = pm.user_id);
delete from public.progreso_evaluacion pe where not exists (select 1 from public.usuarios u where u.id = pe.user_id);
alter table public.progreso_modulo drop constraint if exists progreso_modulo_user_id_fkey;
alter table public.progreso_modulo add constraint progreso_modulo_user_id_fkey
  foreign key (user_id) references public.usuarios(id) on delete cascade;
alter table public.progreso_evaluacion drop constraint if exists progreso_evaluacion_user_id_fkey;
alter table public.progreso_evaluacion add constraint progreso_evaluacion_user_id_fkey
  foreign key (user_id) references public.usuarios(id) on delete cascade;

-- 4. Vista sin contraseña (la app la sigue usando como "perfiles") ------
create or replace view public.perfiles with (security_invoker = true) as
  select id, name, email, ci, role, role_label, avatar, status, created_at
  from public.usuarios;
grant select, update, delete on public.perfiles to anon, authenticated;

-- 5. Quién hace la petición ---------------------------------------------
create or replace function public.usuario_actual_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.usuario_id
  from public.sesiones s
  where s.token = nullif(current_setting('request.headers', true)::json->>'x-session-token', '')
    and s.expires_at > now();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios
    where id = public.usuario_actual_id() and role = 'admin'
  );
$$;

-- Un usuario normal puede editar su nombre, cédula y avatar, pero no su rol.
-- Sin token (SQL Editor) se permite todo. El correo y la contraseña ya no se
-- pueden cambiar por la API (no tienen permiso de UPDATE, ver sección 1).
create or replace function public.proteger_campos_usuario()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.usuario_actual_id() is not null and not public.is_admin() then
    new.role       := old.role;
    new.role_label := old.role_label;
    new.status     := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists usuarios_proteger_campos on public.usuarios;
create trigger usuarios_proteger_campos
  before update on public.usuarios
  for each row execute function public.proteger_campos_usuario();

-- 6. Funciones de cuenta (lo único que la app puede hacer con contraseñas)
create or replace function public._crear_sesion(p_usuario_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  delete from public.sesiones where usuario_id = p_usuario_id and expires_at <= now();
  insert into public.sesiones (usuario_id) values (p_usuario_id) returning token into v_token;
  return json_build_object(
    'token', v_token,
    'usuario', (select to_jsonb(u) - 'password_hash' from public.usuarios u where u.id = p_usuario_id)
  );
end;
$$;
revoke execute on function public._crear_sesion(uuid) from public, anon, authenticated;

create or replace function public.registrar_usuario(p_name text, p_email text, p_password text, p_ci text default null)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := trim(p_name);
begin
  if coalesce(v_name, '') = '' then raise exception 'Escribe tu nombre.'; end if;
  if coalesce(trim(p_email), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'El correo no es válido.'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres.'; end if;
  if exists (select 1 from public.usuarios where lower(email) = lower(trim(p_email))) then
    raise exception 'Este correo ya tiene una cuenta. Inicia sesión.';
  end if;

  insert into public.usuarios (name, email, password_hash, ci, avatar)
  values (
    v_name,
    lower(trim(p_email)),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    nullif(trim(p_ci), ''),
    upper(left(regexp_replace(initcap(v_name), '[^A-ZÁÉÍÓÚÑ]', '', 'g'), 2))
  )
  returning id into v_id;

  return public._crear_sesion(v_id);
end;
$$;

create or replace function public.iniciar_sesion(p_email text, p_password text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.usuarios;
begin
  select * into v_user from public.usuarios where lower(email) = lower(trim(p_email));
  if v_user.id is null or v_user.password_hash <> extensions.crypt(p_password, v_user.password_hash) then
    raise exception 'Correo o contraseña incorrectos.';
  end if;
  if v_user.status = 'Inactivo' then
    raise exception 'Tu cuenta está desactivada. Contacta al administrador.';
  end if;
  return public._crear_sesion(v_user.id);
end;
$$;

create or replace function public.mi_usuario()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select (to_jsonb(u) - 'password_hash')::json from public.usuarios u where u.id = public.usuario_actual_id();
$$;

create or replace function public.cerrar_sesion()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.sesiones
  where token = current_setting('request.headers', true)::json->>'x-session-token';
$$;

create or replace function public.cambiar_password(p_actual text, p_nueva text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.usuarios;
begin
  select * into v_user from public.usuarios where id = public.usuario_actual_id();
  if v_user.id is null then raise exception 'Inicia sesión de nuevo.'; end if;
  if v_user.password_hash <> extensions.crypt(p_actual, v_user.password_hash) then
    raise exception 'La contraseña actual no es correcta.';
  end if;
  if length(coalesce(p_nueva, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres.'; end if;
  update public.usuarios set password_hash = extensions.crypt(p_nueva, extensions.gen_salt('bf')) where id = v_user.id;
end;
$$;

-- Solo admin: crear usuarios y restablecer contraseñas (no hay correos de recuperación)
create or replace function public.admin_crear_usuario(p_name text, p_email text, p_password text, p_es_admin boolean default false)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_name text := trim(p_name);
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede crear usuarios.'; end if;
  if coalesce(v_name, '') = '' then raise exception 'Escribe el nombre.'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres.'; end if;
  if exists (select 1 from public.usuarios where lower(email) = lower(trim(p_email))) then
    raise exception 'Ese correo ya tiene una cuenta.';
  end if;

  insert into public.usuarios (name, email, password_hash, role, role_label, avatar)
  values (
    v_name,
    lower(trim(p_email)),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    case when p_es_admin then 'admin' else 'user' end,
    case when p_es_admin then 'Administrador / Dirigente' else 'Scouter / Educador' end,
    upper(left(regexp_replace(initcap(v_name), '[^A-ZÁÉÍÓÚÑ]', '', 'g'), 2))
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.admin_cambiar_password(p_usuario_id uuid, p_nueva text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Solo un administrador puede cambiar contraseñas.'; end if;
  if length(coalesce(p_nueva, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres.'; end if;
  update public.usuarios set password_hash = extensions.crypt(p_nueva, extensions.gen_salt('bf')) where id = p_usuario_id;
  delete from public.sesiones where usuario_id = p_usuario_id;
end;
$$;

grant execute on function
  public.registrar_usuario(text, text, text, text),
  public.iniciar_sesion(text, text),
  public.mi_usuario(),
  public.cerrar_sesion(),
  public.cambiar_password(text, text),
  public.admin_crear_usuario(text, text, text, boolean),
  public.admin_cambiar_password(uuid, text)
to anon, authenticated;

-- 7. Reglas RLS con el usuario del token -------------------------------
drop policy if exists usuarios_select on public.usuarios;
drop policy if exists usuarios_update on public.usuarios;
drop policy if exists usuarios_delete on public.usuarios;
create policy usuarios_select on public.usuarios for select to anon, authenticated
  using (id = (select public.usuario_actual_id()) or (select public.is_admin()));
create policy usuarios_update on public.usuarios for update to anon, authenticated
  using (id = (select public.usuario_actual_id()) or (select public.is_admin()))
  with check (id = (select public.usuario_actual_id()) or (select public.is_admin()));
create policy usuarios_delete on public.usuarios for delete to anon, authenticated
  using ((select public.is_admin()));

-- Contenido: lo ve cualquier usuario con sesión; solo el admin lo modifica
drop policy if exists cursos_select on public.cursos;
drop policy if exists cursos_write on public.cursos;
create policy cursos_select on public.cursos for select to anon, authenticated
  using ((select public.usuario_actual_id()) is not null);
create policy cursos_write on public.cursos for all to anon, authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists modulos_select on public.modulos;
drop policy if exists modulos_write on public.modulos;
create policy modulos_select on public.modulos for select to anon, authenticated
  using ((select public.usuario_actual_id()) is not null);
create policy modulos_write on public.modulos for all to anon, authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists evaluaciones_select on public.evaluaciones;
drop policy if exists evaluaciones_write on public.evaluaciones;
create policy evaluaciones_select on public.evaluaciones for select to anon, authenticated
  using ((select public.usuario_actual_id()) is not null);
create policy evaluaciones_write on public.evaluaciones for all to anon, authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Progreso: cada usuario el suyo; el admin puede leer todo
drop policy if exists progreso_modulo_own on public.progreso_modulo;
create policy progreso_modulo_own on public.progreso_modulo for all to anon, authenticated
  using (user_id = (select public.usuario_actual_id()) or (select public.is_admin()))
  with check (user_id = (select public.usuario_actual_id()));

drop policy if exists progreso_evaluacion_own on public.progreso_evaluacion;
create policy progreso_evaluacion_own on public.progreso_evaluacion for all to anon, authenticated
  using (user_id = (select public.usuario_actual_id()) or (select public.is_admin()))
  with check (user_id = (select public.usuario_actual_id()));

-- Storage: el bucket es público para leer; subir/cambiar/borrar solo admin
drop policy if exists bucket_insert on storage.objects;
drop policy if exists bucket_update on storage.objects;
drop policy if exists bucket_delete on storage.objects;
create policy bucket_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'bucket' and public.is_admin());
create policy bucket_update on storage.objects for update to anon, authenticated
  using (bucket_id = 'bucket' and public.is_admin());
create policy bucket_delete on storage.objects for delete to anon, authenticated
  using (bucket_id = 'bucket' and public.is_admin());

-- 8. Primer administrador ----------------------------------------------
-- Regístrate en la app y luego ejecuta (cambiando el correo):
-- update public.usuarios set role = 'admin', role_label = 'Administrador / Dirigente'
-- where lower(email) = 'tu-correo@ejemplo.com';
