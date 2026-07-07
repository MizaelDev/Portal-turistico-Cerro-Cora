create extension if not exists pgcrypto;

create table if not exists public.pontos_turisticos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null,
  categoria text not null check (
    categoria in ('mirante', 'natureza', 'geoturismo', 'ecoturismo', 'trilha', 'aventura')
  ),
  localizacao text not null,
  imagem_url text not null,
  imagens_urls text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pousadas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null,
  localizacao text not null,
  distancia_centro text,
  faixa_preco_min numeric(10, 2),
  faixa_preco_max numeric(10, 2),
  whatsapp text not null,
  imagens_urls text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurantes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text,
  descricao text not null,
  descricao_completa text,
  categoria text not null check (
    categoria in ('restaurante', 'almoço', 'bar', 'café', 'lanchonete')
  ),
  horario_funcionamento text not null,
  endereco text not null,
  mapa_url text,
  instagram text,
  instagram_url text,
  whatsapp text not null,
  telefone text,
  imagem_url text not null,
  logo_url text,
  imagens_urls text[] not null default '{}',
  tags text[] not null default '{}',
  formas_pagamento text[] not null default '{}',
  diferenciais text[] not null default '{}',
  especialidades text[] not null default '{}',
  prato_recomendado text,
  dica_turista text,
  cardapio_url text,
  faixa_preco text,
  destaque boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.restaurantes
  add column if not exists mapa_url text,
  add column if not exists instagram_url text,
  add column if not exists tags text[] not null default '{}',
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

alter table public.pontos_turisticos
  add column if not exists imagens_urls text[] not null default '{}';

alter table public.restaurantes
  drop constraint if exists restaurantes_categoria_check;

alter table public.restaurantes
  add constraint restaurantes_categoria_check
  check (categoria in ('restaurante', 'almoço', 'bar', 'café', 'lanchonete'));

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.user_id = $1
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('tourism', 'tourism', true)
on conflict (id) do nothing;

alter table public.pontos_turisticos enable row level security;
alter table public.pousadas enable row level security;
alter table public.restaurantes enable row level security;
alter table public.admin_users enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.pontos_turisticos to anon, authenticated;
grant select on public.pousadas to anon, authenticated;
grant select on public.restaurantes to anon, authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.pontos_turisticos to authenticated;
grant insert, update, delete on public.pousadas to authenticated;
grant insert, update, delete on public.restaurantes to authenticated;
grant insert, update, delete on public.admin_users to authenticated;

drop policy if exists "Authenticated users read own admin flag" on public.admin_users;
drop policy if exists "Admins manage admin users" on public.admin_users;

drop policy if exists "Public read active pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated read pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated insert pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated update pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated delete pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Admin read pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Admin insert pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Admin update pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Admin delete pontos_turisticos" on public.pontos_turisticos;

drop policy if exists "Public read active pousadas" on public.pousadas;
drop policy if exists "Authenticated read pousadas" on public.pousadas;
drop policy if exists "Authenticated insert pousadas" on public.pousadas;
drop policy if exists "Authenticated update pousadas" on public.pousadas;
drop policy if exists "Authenticated delete pousadas" on public.pousadas;
drop policy if exists "Admin read pousadas" on public.pousadas;
drop policy if exists "Admin insert pousadas" on public.pousadas;
drop policy if exists "Admin update pousadas" on public.pousadas;
drop policy if exists "Admin delete pousadas" on public.pousadas;

drop policy if exists "Public read active restaurantes" on public.restaurantes;
drop policy if exists "Authenticated read restaurantes" on public.restaurantes;
drop policy if exists "Authenticated insert restaurantes" on public.restaurantes;
drop policy if exists "Authenticated update restaurantes" on public.restaurantes;
drop policy if exists "Authenticated delete restaurantes" on public.restaurantes;
drop policy if exists "Admin read restaurantes" on public.restaurantes;
drop policy if exists "Admin insert restaurantes" on public.restaurantes;
drop policy if exists "Admin update restaurantes" on public.restaurantes;
drop policy if exists "Admin delete restaurantes" on public.restaurantes;

create policy "Public read active pontos_turisticos"
  on public.pontos_turisticos for select
  using (ativo = true);

create policy "Admin read pontos_turisticos"
  on public.pontos_turisticos for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admin insert pontos_turisticos"
  on public.pontos_turisticos for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "Admin update pontos_turisticos"
  on public.pontos_turisticos for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admin delete pontos_turisticos"
  on public.pontos_turisticos for delete
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Public read active pousadas"
  on public.pousadas for select
  using (ativo = true);

create policy "Admin read pousadas"
  on public.pousadas for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admin insert pousadas"
  on public.pousadas for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "Admin update pousadas"
  on public.pousadas for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admin delete pousadas"
  on public.pousadas for delete
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Public read active restaurantes"
  on public.restaurantes for select
  using (ativo = true);

create policy "Admin read restaurantes"
  on public.restaurantes for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admin insert restaurantes"
  on public.restaurantes for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "Admin update restaurantes"
  on public.restaurantes for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admin delete restaurantes"
  on public.restaurantes for delete
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Authenticated users read own admin flag"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins manage admin users"
  on public.admin_users for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Public read tourism files" on storage.objects;
drop policy if exists "Authenticated insert tourism files" on storage.objects;
drop policy if exists "Authenticated update tourism files" on storage.objects;
drop policy if exists "Authenticated delete tourism files" on storage.objects;

create policy "Public read tourism files"
  on storage.objects for select
  using (bucket_id = 'tourism');

create policy "Authenticated insert tourism files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'tourism' and public.is_admin(auth.uid()));

create policy "Authenticated update tourism files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tourism' and public.is_admin(auth.uid()))
  with check (bucket_id = 'tourism' and public.is_admin(auth.uid()));

create policy "Authenticated delete tourism files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tourism' and public.is_admin(auth.uid()));
