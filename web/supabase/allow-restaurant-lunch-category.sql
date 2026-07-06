alter table public.restaurantes
  drop constraint if exists restaurantes_categoria_check;

alter table public.restaurantes
  add constraint restaurantes_categoria_check
  check (categoria in ('restaurante', 'almoço', 'bar', 'café', 'lanchonete'));
