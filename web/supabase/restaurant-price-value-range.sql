-- Separa a categoria de preco da faixa textual exibida ao visitante.
-- Cole este arquivo no SQL Editor do Supabase e clique em Run.
-- A coluna existente faixa_preco e todos os restaurantes atuais sao preservados.

begin;

alter table public.restaurantes
  add column if not exists faixa_valores text;

comment on column public.restaurantes.faixa_preco is
  'Categoria de preco do restaurante: R$, R$$ ou R$$$.';

comment on column public.restaurantes.faixa_valores is
  'Faixa textual opcional exibida ao visitante, por exemplo: R$ 15 a R$ 70.';

commit;

notify pgrst, 'reload schema';
