alter table public.perfis
drop constraint if exists perfis_perfil_check;

alter table public.perfis
add constraint perfis_perfil_check
check (perfil in ('administrador', 'diretora', 'coordenadora', 'visualizacao'));
