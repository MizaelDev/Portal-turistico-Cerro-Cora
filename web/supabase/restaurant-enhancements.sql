alter table public.restaurantes
  add column if not exists mapa_url text,
  add column if not exists instagram_url text,
  add column if not exists tags text[] not null default '{}';

update public.restaurantes
set tags = array_remove(array[
  case when categoria = 'restaurante' then 'Restaurante' end,
  case when categoria = 'bar' then 'Bar' end,
  case when categoria = 'café' then 'Café' end,
  case when categoria = 'lanchonete' then 'Lanches' end,
  case when lower(nome || ' ' || descricao) like '%pizza%' then 'Pizza' end,
  case when lower(nome || ' ' || descricao) like '%hamb%' then 'Hambúrguer' end,
  case when lower(nome || ' ' || descricao) like '%aça%' then 'Açaí' end,
  case when lower(nome || ' ' || descricao) like '%acai%' then 'Açaí' end,
  case when lower(nome || ' ' || descricao) like '%petisc%' then 'Petiscos' end,
  case when lower(nome || ' ' || descricao) like '%delivery%' then 'Delivery' end
], null)
where tags = '{}' or tags is null;
