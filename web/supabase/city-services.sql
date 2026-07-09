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
  is_emergency boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.city_services enable row level security;

drop policy if exists "city_services public read active" on public.city_services;
create policy "city_services public read active"
on public.city_services for select
to anon, authenticated
using (is_active = true);

drop policy if exists "city_services admin write" on public.city_services;
create policy "city_services admin write"
on public.city_services for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create index if not exists city_services_category_idx on public.city_services(category);
create index if not exists city_services_active_idx on public.city_services(is_active);
create index if not exists city_services_emergency_idx on public.city_services(is_emergency);
