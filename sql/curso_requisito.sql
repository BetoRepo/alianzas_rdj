-- =====================================================================
-- Curso requisito: un curso puede exigir que antes se termine otro.
-- Ejecutar en: Supabase → SQL Editor. No borra datos. Se puede ejecutar
-- más de una vez.
--
-- Si se borra el curso requisito, el otro queda libre (on delete set null).
-- =====================================================================

alter table public.cursos add column if not exists requisito_id bigint
  references public.cursos(id) on delete set null;

alter table public.cursos drop constraint if exists cursos_requisito_distinto;
alter table public.cursos add constraint cursos_requisito_distinto
  check (requisito_id is null or requisito_id <> id);

create index if not exists cursos_requisito_idx on public.cursos (requisito_id);
