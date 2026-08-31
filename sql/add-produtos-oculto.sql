alter table public.produtos
add column if not exists oculto boolean not null default false;

comment on column public.produtos.oculto is
'Indica se o produto deve ficar oculto nas listas principais sem apagar historico de movimentacoes.';
