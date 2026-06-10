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
  descricao text not null,
  categoria text not null check (
    categoria in ('restaurante', 'bar', 'café', 'lanchonete')
  ),
  horario_funcionamento text not null,
  endereco text not null,
  mapa_url text,
  instagram text,
  instagram_url text,
  whatsapp text not null,
  imagem_url text not null,
  tags text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.restaurantes
  add column if not exists mapa_url text,
  add column if not exists instagram_url text,
  add column if not exists tags text[] not null default '{}';

insert into storage.buckets (id, name, public)
values ('tourism', 'tourism', true)
on conflict (id) do nothing;

alter table public.pontos_turisticos enable row level security;
alter table public.pousadas enable row level security;
alter table public.restaurantes enable row level security;

drop policy if exists "Public read active pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated read pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated insert pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated update pontos_turisticos" on public.pontos_turisticos;
drop policy if exists "Authenticated delete pontos_turisticos" on public.pontos_turisticos;

drop policy if exists "Public read active pousadas" on public.pousadas;
drop policy if exists "Authenticated read pousadas" on public.pousadas;
drop policy if exists "Authenticated insert pousadas" on public.pousadas;
drop policy if exists "Authenticated update pousadas" on public.pousadas;
drop policy if exists "Authenticated delete pousadas" on public.pousadas;

drop policy if exists "Public read active restaurantes" on public.restaurantes;
drop policy if exists "Authenticated read restaurantes" on public.restaurantes;
drop policy if exists "Authenticated insert restaurantes" on public.restaurantes;
drop policy if exists "Authenticated update restaurantes" on public.restaurantes;
drop policy if exists "Authenticated delete restaurantes" on public.restaurantes;

create policy "Public read active pontos_turisticos"
  on public.pontos_turisticos for select
  using (ativo = true);

create policy "Authenticated read pontos_turisticos"
  on public.pontos_turisticos for select
  to authenticated
  using (true);

create policy "Authenticated insert pontos_turisticos"
  on public.pontos_turisticos for insert
  to authenticated
  with check (true);

create policy "Authenticated update pontos_turisticos"
  on public.pontos_turisticos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated delete pontos_turisticos"
  on public.pontos_turisticos for delete
  to authenticated
  using (true);

create policy "Public read active pousadas"
  on public.pousadas for select
  using (ativo = true);

create policy "Authenticated read pousadas"
  on public.pousadas for select
  to authenticated
  using (true);

create policy "Authenticated insert pousadas"
  on public.pousadas for insert
  to authenticated
  with check (true);

create policy "Authenticated update pousadas"
  on public.pousadas for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated delete pousadas"
  on public.pousadas for delete
  to authenticated
  using (true);

create policy "Public read active restaurantes"
  on public.restaurantes for select
  using (ativo = true);

create policy "Authenticated read restaurantes"
  on public.restaurantes for select
  to authenticated
  using (true);

create policy "Authenticated insert restaurantes"
  on public.restaurantes for insert
  to authenticated
  with check (true);

create policy "Authenticated update restaurantes"
  on public.restaurantes for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated delete restaurantes"
  on public.restaurantes for delete
  to authenticated
  using (true);

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
  with check (bucket_id = 'tourism');

create policy "Authenticated update tourism files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tourism')
  with check (bucket_id = 'tourism');

create policy "Authenticated delete tourism files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tourism');
