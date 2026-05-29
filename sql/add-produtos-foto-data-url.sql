alter table public.produtos
add column if not exists foto_data_url text;

comment on column public.produtos.foto_data_url is
'Foto do produto otimizada pelo app em data URL. Limite recomendado: 220 KB.';
