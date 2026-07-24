-- Execute este arquivo no SQL Editor do Supabase para habilitar o link
-- externo do botao "Saiba mais" nos pontos turisticos.
alter table public.pontos_turisticos
  add column if not exists info_url text;

alter table public.pontos_turisticos
  drop constraint if exists pontos_turisticos_info_url_https_check;

alter table public.pontos_turisticos
  add constraint pontos_turisticos_info_url_https_check
  check (info_url is null or info_url ~* '^https://');

comment on column public.pontos_turisticos.info_url is
  'URL HTTPS externa aberta pelo botao Saiba mais do ponto turistico.';
