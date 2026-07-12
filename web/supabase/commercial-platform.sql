-- Evolução comercial do portal.
-- Pode ser executado mais de uma vez no SQL Editor do Supabase.

alter table if exists public.restaurantes
  add column if not exists plano text not null default 'basic',
  add column if not exists whatsapp_message text,
  add column if not exists site_url text,
  add column if not exists pagina_ativa boolean not null default false;

alter table if exists public.restaurantes
  drop constraint if exists restaurantes_plano_check;

alter table if exists public.restaurantes
  add constraint restaurantes_plano_check
  check (plano in ('basic', 'pro'));

update public.restaurantes
set plano = 'pro',
    pagina_ativa = true
where coalesce(destaque, false) = true
   or coalesce(array_length(imagens_urls, 1), 0) > 0
   or slug is not null;

alter table if exists public.pousadas
  add column if not exists plano text not null default 'basic',
  add column if not exists whatsapp_message text,
  add column if not exists site_url text,
  add column if not exists pagina_ativa boolean not null default false;

alter table if exists public.pousadas
  drop constraint if exists pousadas_plano_check;

alter table if exists public.pousadas
  add constraint pousadas_plano_check
  check (plano in ('basic', 'pro'));

update public.pousadas
set plano = 'pro',
    pagina_ativa = true
where coalesce(destaque, false) = true
   or coalesce(array_length(imagens_urls, 1), 0) > 1
   or slug is not null;

alter table if exists public.city_services
  add column if not exists instagram text,
  add column if not exists instagram_url text,
  add column if not exists site_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists image_url text,
  add column if not exists logo_url text,
  add column if not exists plan text not null default 'basic',
  add column if not exists tags text[] not null default '{}',
  add column if not exists enabled_buttons text[] not null default '{}',
  add column if not exists important_message text,
  add column if not exists is_24h boolean not null default false,
  add column if not exists whatsapp_message text;

alter table if exists public.city_services
  drop constraint if exists city_services_category_check;

alter table if exists public.city_services
  drop constraint if exists city_services_plan_check;

alter table if exists public.city_services
  add constraint city_services_plan_check
  check (plan in ('basic', 'pro'));

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  city_id uuid,
  name text not null,
  slug text not null,
  parent_slug text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(city_id, slug)
);

create table if not exists public.establishment_metrics (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('restaurant', 'lodging', 'city_service')),
  entity_id uuid not null,
  event_type text not null check (
    event_type in (
      'card_view',
      'page_view',
      'whatsapp_click',
      'map_click',
      'instagram_click',
      'site_click',
      'phone_click',
      'reserve_click',
      'details_click',
      'gallery_click',
      'carousel_click'
    )
  ),
  source_path text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  establishment_id text not null,
  entity_type text not null check (entity_type in ('restaurant', 'lodging', 'city_service')),
  event_type text not null check (
    event_type in (
      'card_view',
      'page_view',
      'whatsapp_click',
      'map_click',
      'instagram_click',
      'site_click',
      'phone_click',
      'reserve_click',
      'details_click',
      'gallery_click',
      'carousel_click',
      'cta_click'
    )
  ),
  establishment_name text,
  category text,
  plan_type text,
  source_path text,
  session_id text,
  ip_hash text,
  user_agent text,
  referrer text,
  source_channel text,
  city text,
  created_at timestamptz not null default now()
);

alter table if exists public.analytics_events
  alter column establishment_id type text using establishment_id::text;

alter table public.service_categories enable row level security;
alter table public.establishment_metrics enable row level security;
alter table public.analytics_events enable row level security;

grant select on public.service_categories to anon, authenticated;
grant insert, update, delete on public.service_categories to authenticated;

grant select, delete on public.establishment_metrics to authenticated;

grant select, delete on public.analytics_events to authenticated;

drop policy if exists "service_categories public read active" on public.service_categories;
create policy "service_categories public read active"
on public.service_categories for select
to anon, authenticated
using (is_active = true);

drop policy if exists "service_categories admin write" on public.service_categories;
create policy "service_categories admin write"
on public.service_categories for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "metrics public insert" on public.establishment_metrics;
revoke insert on public.establishment_metrics from anon, authenticated;

drop policy if exists "metrics admin read" on public.establishment_metrics;
create policy "metrics admin read"
on public.establishment_metrics for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "metrics admin delete" on public.establishment_metrics;
create policy "metrics admin delete"
on public.establishment_metrics for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "analytics_events public insert" on public.analytics_events;
revoke insert on public.analytics_events from anon, authenticated;

drop policy if exists "analytics_events admin read" on public.analytics_events;
create policy "analytics_events admin read"
on public.analytics_events for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "analytics_events admin delete" on public.analytics_events;
create policy "analytics_events admin delete"
on public.analytics_events for delete
to authenticated
using (public.is_admin(auth.uid()));

-- A aplicação grava eventos pela rota de servidor usando a service role.
-- Bloqueia inserções diretas com a anon key para reduzir fraude de métricas.
drop policy if exists "analytics_events public insert" on public.analytics_events;
revoke insert on public.analytics_events from anon, authenticated;

-- Tabela legada: permanece disponível para consulta administrativa, mas não aceita
-- gravações públicas. Novos eventos usam exclusivamente analytics_events.
drop policy if exists "metrics public insert" on public.establishment_metrics;
revoke insert on public.establishment_metrics from anon, authenticated;

create table if not exists public.analytics_daily_stats (
  event_date date not null,
  establishment_id text not null,
  entity_type text not null check (entity_type in ('restaurant', 'lodging', 'city_service')),
  event_type text not null,
  establishment_name text,
  category text,
  plan_type text,
  event_count bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (event_date, establishment_id, entity_type, event_type)
);

alter table public.analytics_daily_stats enable row level security;
grant select on public.analytics_daily_stats to authenticated;
revoke insert, update, delete on public.analytics_daily_stats from anon, authenticated;

drop policy if exists "analytics_daily_stats admin read" on public.analytics_daily_stats;
create policy "analytics_daily_stats admin read"
on public.analytics_daily_stats for select
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.aggregate_analytics_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_daily_stats (
    event_date,
    establishment_id,
    entity_type,
    event_type,
    establishment_name,
    category,
    plan_type,
    event_count,
    updated_at
  ) values (
    (new.created_at at time zone 'America/Fortaleza')::date,
    new.establishment_id,
    new.entity_type,
    new.event_type,
    new.establishment_name,
    new.category,
    new.plan_type,
    1,
    now()
  )
  on conflict (event_date, establishment_id, entity_type, event_type)
  do update set
    event_count = public.analytics_daily_stats.event_count + 1,
    establishment_name = coalesce(excluded.establishment_name, public.analytics_daily_stats.establishment_name),
    category = coalesce(excluded.category, public.analytics_daily_stats.category),
    plan_type = coalesce(excluded.plan_type, public.analytics_daily_stats.plan_type),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists analytics_events_daily_stats_trigger on public.analytics_events;
create trigger analytics_events_daily_stats_trigger
after insert on public.analytics_events
for each row execute function public.aggregate_analytics_event();

insert into public.analytics_daily_stats (
  event_date,
  establishment_id,
  entity_type,
  event_type,
  establishment_name,
  category,
  plan_type,
  event_count,
  updated_at
)
select
  (created_at at time zone 'America/Fortaleza')::date,
  establishment_id,
  entity_type,
  event_type,
  max(establishment_name),
  max(category),
  max(plan_type),
  count(*),
  now()
from public.analytics_events
group by 1, 2, 3, 4
on conflict (event_date, establishment_id, entity_type, event_type)
do update set
  event_count = excluded.event_count,
  establishment_name = excluded.establishment_name,
  category = excluded.category,
  plan_type = excluded.plan_type,
  updated_at = now();

create or replace function public.analytics_report_summary(p_since date default (current_date - 90))
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  select jsonb_build_object(
    'totalsPeriod', (
      select jsonb_build_object(
        'total', coalesce(sum(event_count), 0),
        'views', coalesce(sum(event_count) filter (where event_type in ('card_view', 'page_view')), 0),
        'clicks', coalesce(sum(event_count) filter (where event_type not in ('card_view', 'page_view')), 0)
      )
      from public.analytics_daily_stats
      where event_date >= p_since
    ),
    'byEvent', coalesce((
      select jsonb_agg(to_jsonb(event_rows) order by event_rows.count desc)
      from (
        select event_type as event, sum(event_count)::bigint as count
        from public.analytics_daily_stats
        where event_date >= p_since
        group by event_type
      ) event_rows
    ), '[]'::jsonb),
    'byDay', coalesce((
      select jsonb_agg(to_jsonb(day_rows) order by day_rows.day desc)
      from (
        select event_date::text as day, sum(event_count)::bigint as count
        from public.analytics_daily_stats
        where event_date >= p_since
        group by event_date
      ) day_rows
    ), '[]'::jsonb),
    'byEstablishment', coalesce((
      select jsonb_agg(to_jsonb(establishment_rows) order by establishment_rows.total desc)
      from (
        select
          establishment_id as id,
          coalesce(max(establishment_name), 'Estabelecimento') as name,
          coalesce(max(category), max(entity_type)) as category,
          coalesce(max(plan_type), 'basic') as plan,
          coalesce(sum(event_count) filter (where event_type in ('card_view', 'page_view')), 0)::bigint as views,
          coalesce(sum(event_count) filter (where event_type not in ('card_view', 'page_view')), 0)::bigint as clicks,
          sum(event_count)::bigint as total
        from public.analytics_daily_stats
        where event_date >= p_since
        group by establishment_id
      ) establishment_rows
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.analytics_report_summary(date) from public, anon;
grant execute on function public.analytics_report_summary(date) to authenticated;

create index if not exists restaurantes_plano_idx on public.restaurantes(plano);
create index if not exists pousadas_plano_idx on public.pousadas(plano);
create index if not exists city_services_plan_idx on public.city_services(plan);
create index if not exists city_services_category_text_idx on public.city_services(category);
create index if not exists establishment_metrics_entity_idx on public.establishment_metrics(entity_type, entity_id);
create index if not exists establishment_metrics_event_idx on public.establishment_metrics(event_type);
create index if not exists establishment_metrics_created_idx on public.establishment_metrics(created_at desc);
create index if not exists analytics_events_establishment_idx on public.analytics_events(establishment_id);
create index if not exists analytics_events_entity_idx on public.analytics_events(entity_type, establishment_id);
create index if not exists analytics_events_event_idx on public.analytics_events(event_type);
create index if not exists analytics_events_created_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_session_idx on public.analytics_events(session_id);
create index if not exists analytics_events_establishment_date_idx
on public.analytics_events(establishment_id, created_at desc, event_type);
create index if not exists analytics_daily_stats_date_idx
on public.analytics_daily_stats(event_date desc);
create index if not exists analytics_daily_stats_establishment_idx
on public.analytics_daily_stats(establishment_id, event_date desc);
create unique index if not exists service_categories_global_slug_idx
on public.service_categories(slug)
where city_id is null;

insert into public.service_categories (name, slug, sort_order)
values
  ('Saúde', 'saude', 10),
  ('Farmácias', 'farmacias', 20),
  ('Hospital', 'hospital', 30),
  ('UBS', 'ubs', 40),
  ('Segurança', 'seguranca', 50),
  ('Delegacia', 'delegacia', 60),
  ('Polícia Militar', 'policia-militar', 70),
  ('Correios', 'correios', 80),
  ('Lotéricas', 'lotericas', 90),
  ('Bancos', 'bancos', 100),
  ('Mercados', 'mercados', 110),
  ('Supermercados', 'supermercados', 120),
  ('Padarias', 'padarias', 130),
  ('Postos de Combustível', 'postos-combustivel', 140),
  ('Oficinas', 'oficinas', 150),
  ('Borracharias', 'borracharias', 160),
  ('Restaurantes', 'restaurantes', 170),
  ('Lanchonetes', 'lanchonetes', 180),
  ('Pizzarias', 'pizzarias', 190),
  ('Hamburguerias', 'hamburguerias', 200),
  ('Açaís', 'acais', 210),
  ('Sorveterias', 'sorveterias', 220),
  ('Hotéis', 'hoteis', 230),
  ('Pousadas', 'pousadas', 240),
  ('Guias turísticos', 'guias-turisticos', 250)
on conflict do nothing;
