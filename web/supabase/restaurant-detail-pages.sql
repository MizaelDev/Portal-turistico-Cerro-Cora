-- Atualização para páginas individuais de restaurantes.
-- Cole este arquivo no SQL Editor do Supabase e clique em Run.
-- Ele não apaga dados existentes.

alter table public.restaurantes
  add column if not exists slug text,
  add column if not exists descricao_completa text,
  add column if not exists telefone text,
  add column if not exists logo_url text,
  add column if not exists imagens_urls text[] not null default '{}',
  add column if not exists formas_pagamento text[] not null default '{}',
  add column if not exists diferenciais text[] not null default '{}',
  add column if not exists especialidades text[] not null default '{}',
  add column if not exists prato_recomendado text,
  add column if not exists dica_turista text,
  add column if not exists cardapio_url text,
  add column if not exists faixa_preco text,
  add column if not exists destaque boolean not null default false,
  add column if not exists updated_at timestamptz;

create unique index if not exists restaurantes_slug_unique
  on public.restaurantes(slug)
  where slug is not null;

create or replace function public.set_restaurantes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurantes_set_updated_at on public.restaurantes;

create trigger restaurantes_set_updated_at
before update on public.restaurantes
for each row
execute function public.set_restaurantes_updated_at();
