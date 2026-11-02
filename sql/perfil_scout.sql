-- =====================================================================
-- Datos scout del perfil y portada de módulos
-- Ejecutar en: Supabase → SQL Editor, DESPUÉS de usuarios_propios.sql.
-- No borra datos. Se puede ejecutar más de una vez.
--
--  * usuarios: fecha de nacimiento, grupo, región, distrito y unidad.
--    La rama (Lobato, Scout, Caminante, Rover) se deduce de la unidad
--    en la app, no se guarda.
--  * modulos: imagen de portada opcional.
-- =====================================================================

-- 1. Nuevas columnas ---------------------------------------------------
alter table public.usuarios add column if not exists fecha_nacimiento date;
alter table public.usuarios add column if not exists grupo    text;
alter table public.usuarios add column if not exists region   text;
alter table public.usuarios add column if not exists distrito text;
alter table public.usuarios add column if not exists unidad   text;

alter table public.usuarios drop constraint if exists usuarios_unidad_check;
alter table public.usuarios add constraint usuarios_unidad_check
  check (unidad is null or unidad in ('Manada', 'Tropa', 'Comunidad', 'Clan'));

alter table public.usuarios drop constraint if exists usuarios_fecha_nacimiento_check;
alter table public.usuarios add constraint usuarios_fecha_nacimiento_check
  check (fecha_nacimiento is null or (fecha_nacimiento > date '1900-01-01' and fecha_nacimiento <= current_date));

alter table public.modulos add column if not exists imagen_url text;

-- 2. Permisos: cada usuario puede leer y editar sus propios datos scout
grant select (fecha_nacimiento, grupo, region, distrito, unidad) on public.usuarios to anon, authenticated;
grant update (fecha_nacimiento, grupo, region, distrito, unidad) on public.usuarios to anon, authenticated;

-- 3. Vista perfiles con las columnas nuevas (sigue sin la contraseña) ---
create or replace view public.perfiles with (security_invoker = true) as
  select id, name, email, ci, role, role_label, avatar, status, created_at,
         fecha_nacimiento, grupo, region, distrito, unidad
  from public.usuarios;
grant select, update, delete on public.perfiles to anon, authenticated;
