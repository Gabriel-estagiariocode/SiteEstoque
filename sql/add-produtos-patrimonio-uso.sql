alter table public.produtos
add column if not exists patrimonio text,
add column if not exists em_uso boolean not null default false;

comment on column public.produtos.patrimonio is
'Numero ou codigo de patrimonio vinculado ao produto.';

comment on column public.produtos.em_uso is
'Indica se o item esta em uso sem alterar o saldo de estoque.';
