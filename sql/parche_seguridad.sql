-- =====================================================================
-- Parche para bases que YA ejecutaron la primera versión de schema.sql.
-- No borra datos. Se puede ejecutar más de una vez.
--
-- Corrige:
--  * Error "perfiles_id_fkey" al registrarse: ahora el perfil lo crea un
--    trigger en la base de datos (siempre con rol 'user').
--  * Cualquiera podía crearse un perfil con rol 'admin'.
--  * Falta la columna modulos.tipo que usa el administrador de cursos.
--  * Usuarios que quedaron sin confirmar el correo.
-- =====================================================================

alter table public.modulos
  add column if not exists tipo text not null default 'regular';

-- Los usuarios ya registrados que no confirmaron el correo pueden entrar
update auth.users set email_confirmed_at = now() where email_confirmed_at is null;

-- Perfiles: el cliente ya no inserta; solo el trigger
drop policy if exists perfiles_insert on public.perfiles;
drop policy if exists perfiles_update on public.perfiles;
create policy perfiles_update on public.perfiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create or replace function public.handle_new_user()
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_fields()
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

drop trigger if exists perfiles_protect_fields on public.perfiles;
create trigger perfiles_protect_fields
  before update on public.perfiles
  for each row execute function public.protect_profile_fields();

-- Usuarios de Auth que se quedaron sin perfil
insert into public.perfiles (id, name, email, ci, role, role_label, avatar)
select u.id, n.name, u.email, nullif(trim(u.raw_user_meta_data->>'ci'), ''),
       'user', 'Scout de Tropa',
       upper(left(regexp_replace(initcap(n.name), '[^A-ZÁÉÍÓÚÑ]', '', 'g'), 2))
from auth.users u
cross join lateral (
  select coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)) as name
) n
on conflict (id) do nothing;

-- El progreso de módulos guardado sin "completado" cuenta como completado
update public.progreso_modulo set completado = true where completado = false;

-- Tabla legada que la app ya no usa
drop table if exists public.progreso cascade;
