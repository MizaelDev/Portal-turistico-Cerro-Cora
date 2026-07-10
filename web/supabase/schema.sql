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
  slug text,
  descricao text not null,
  historia text,
  categoria text,
  localizacao text not null,
  endereco text,
  mapa_url text,
  distancia_centro text,
  faixa_preco_min numeric(10, 2),
  faixa_preco_max numeric(10, 2),
  whatsapp text not null,
  telefone text,
  instagram text,
  instagram_url text,
  logo_url text,
  hero_image_url text,
  imagens_urls text[] not null default '{}',
  check_in text,
  check_out text,
  business_hours jsonb,
  capacidade text,
  tipos_acomodacao text[] not null default '{}',
  formas_pagamento text[] not null default '{}',
  comodidades text[] not null default '{}',
  diferenciais text[] not null default '{}',
  diferencial_principal text,
  aceita_reservas boolean not null default true,
  destaque boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
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
  business_hours jsonb,
  endereco text not null,
  localizacao_resumida text,
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

create table if not exists public.city_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (
    category in ('saude', 'seguranca', 'transporte_apoio', 'comercio_essencial', 'emergencia')
  ),
  subcategory text not null,
  description text,
  address text,
  neighborhood text,
  phone text,
  whatsapp text,
  google_maps_url text,
  opening_hours text,
  business_hours jsonb,
  is_emergency boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurantes
  add column if not exists mapa_url text,
  add column if not exists instagram_url text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists slug text,
  add column if not exists descricao_completa text,
  add column if not exists telefone text,
  add column if not exists localizacao_resumida text,
  add column if not exists logo_url text,
  add column if not exists imagens_urls text[] not null default '{}',
  add column if not exists formas_pagamento text[] not null default '{}',
  add column if not exists diferenciais text[] not null default '{}',
  add column if not exists especialidades text[] not null default '{}',
  add column if not exists prato_recomendado text,
  add column if not exists dica_turista text,
  add column if not exists cardapio_url text,
  add column if not exists faixa_preco text,
  add column if not exists business_hours jsonb,
  add column if not exists destaque boolean not null default false,
  add column if not exists updated_at timestamptz;

alter table public.pousadas
  add column if not exists slug text,
  add column if not exists historia text,
  add column if not exists categoria text,
  add column if not exists endereco text,
  add column if not exists mapa_url text,
  add column if not exists telefone text,
  add column if not exists instagram text,
  add column if not exists instagram_url text,
  add column if not exists logo_url text,
  add column if not exists hero_image_url text,
  add column if not exists check_in text,
  add column if not exists check_out text,
  add column if not exists business_hours jsonb,
  add column if not exists capacidade text,
  add column if not exists tipos_acomodacao text[] not null default '{}',
  add column if not exists formas_pagamento text[] not null default '{}',
  add column if not exists comodidades text[] not null default '{}',
  add column if not exists diferenciais text[] not null default '{}',
  add column if not exists diferencial_principal text,
  add column if not exists aceita_reservas boolean not null default true,
  add column if not exists destaque boolean not null default false,
  add column if not exists updated_at timestamptz;

create unique index if not exists pousadas_slug_unique
  on public.pousadas(slug)
  where slug is not null;

create unique index if not exists restaurantes_slug_unique
  on public.restaurantes(slug)
  where slug is not null;

alter table public.pontos_turisticos
  add column if not exists imagens_urls text[] not null default '{}';

alter table public.city_services
  add column if not exists business_hours jsonb;

alter table public.restaurantes
  drop constraint if exists restaurantes_categoria_check;

alter table public.restaurantes
  add constraint restaurantes_categoria_check
  check (categoria in ('restaurante', 'almoço', 'bar', 'café', 'lanchonete'));

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.login_rate_limits (
  identifier text primary key,
  attempts integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
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

create or replace function public.check_login_rate_limit(
  p_identifier text,
  p_max_attempts integer default 8,
  p_window_seconds integer default 900
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.login_rate_limits%rowtype;
begin
  if p_identifier is null or length(trim(p_identifier)) = 0 then
    return false;
  end if;

  delete from public.login_rate_limits
  where reset_at < now() - interval '1 hour';

  insert into public.login_rate_limits(identifier, attempts, reset_at, updated_at)
  values (
    p_identifier,
    1,
    now() + make_interval(secs => greatest(p_window_seconds, 60)),
    now()
  )
  on conflict (identifier) do update
  set
    attempts = case
      when public.login_rate_limits.reset_at <= now() then 1
      else public.login_rate_limits.attempts + 1
    end,
    reset_at = case
      when public.login_rate_limits.reset_at <= now()
        then now() + make_interval(secs => greatest(p_window_seconds, 60))
      else public.login_rate_limits.reset_at
    end,
    updated_at = now()
  returning * into attempt_row;

  return attempt_row.reset_at > now() and attempt_row.attempts > greatest(p_max_attempts, 1);
end;
$$;

create or replace function public.clear_login_rate_limit(p_identifier text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.login_rate_limits
  where identifier = p_identifier;
$$;

revoke all on function public.check_login_rate_limit(text, integer, integer) from public;
revoke all on function public.clear_login_rate_limit(text) from public;
grant execute on function public.check_login_rate_limit(text, integer, integer) to anon, authenticated;
grant execute on function public.clear_login_rate_limit(text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('tourism', 'tourism', true)
on conflict (id) do nothing;

update storage.buckets
set
  public = true,
  file_size_limit = 6291456,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'tourism';

alter table public.pontos_turisticos enable row level security;
alter table public.pousadas enable row level security;
alter table public.restaurantes enable row level security;
alter table public.city_services enable row level security;
alter table public.admin_users enable row level security;
alter table public.login_rate_limits enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.pontos_turisticos to anon, authenticated;
grant select on public.pousadas to anon, authenticated;
grant select on public.restaurantes to anon, authenticated;
grant select on public.city_services to anon, authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.pontos_turisticos to authenticated;
grant insert, update, delete on public.pousadas to authenticated;
grant insert, update, delete on public.restaurantes to authenticated;
grant insert, update, delete on public.city_services to authenticated;
grant insert, update, delete on public.admin_users to authenticated;
revoke all on public.login_rate_limits from anon, authenticated;

drop policy if exists "Authenticated users read own admin flag" on public.admin_users;
drop policy if exists "Admins manage admin users" on public.admin_users;

drop policy if exists "city_services public read active" on public.city_services;
drop policy if exists "city_services admin write" on public.city_services;

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

create policy "city_services public read active"
  on public.city_services for select
  to anon, authenticated
  using (is_active = true);

create policy "city_services admin write"
  on public.city_services for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create index if not exists city_services_category_idx on public.city_services(category);
create index if not exists city_services_active_idx on public.city_services(is_active);
create index if not exists city_services_emergency_idx on public.city_services(is_emergency);

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
