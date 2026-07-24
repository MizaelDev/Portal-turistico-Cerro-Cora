-- DEPRECATED: migration historica de planos. Nao execute em instalacoes novas.
-- Planos Bronze, Prata e Ouro.
-- Migration idempotente: execute no SQL Editor do Supabase após schema.sql e commercial-platform.sql.

do $$
declare
  table_name text;
begin
  foreach table_name in array array['restaurantes', 'pousadas'] loop
    execute format('alter table public.%I add column if not exists plan_type text', table_name);
    execute format('alter table public.%I add column if not exists plan_status text not null default ''active''', table_name);
    execute format('alter table public.%I add column if not exists plan_started_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists plan_expires_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists custom_features jsonb not null default ''{}''::jsonb', table_name);
    execute format('alter table public.%I add column if not exists carousel_photo_limit integer', table_name);
    execute format('alter table public.%I add column if not exists gallery_photo_limit integer', table_name);
    execute format('alter table public.%I add column if not exists featured_order integer', table_name);
    execute format('alter table public.%I add column if not exists category_priority integer not null default 0', table_name);
    execute format('alter table public.%I add column if not exists professional_photography_included boolean not null default false', table_name);
    execute format('alter table public.%I add column if not exists photography_completed_at timestamptz', table_name);
    execute format('alter table public.%I add column if not exists social_media_promotion_included boolean not null default false', table_name);
    execute format('alter table public.%I add column if not exists social_media_publication_url text', table_name);
    execute format('alter table public.%I add column if not exists advanced_report_enabled boolean not null default false', table_name);
    execute format('alter table public.%I add column if not exists priority_support_enabled boolean not null default false', table_name);
    execute format('alter table public.%I add column if not exists seasonal_campaign_enabled boolean not null default false', table_name);
    execute format('alter table public.%I add column if not exists establishment_story_enabled boolean not null default false', table_name);
    execute format('alter table public.%I add column if not exists commercial_notes text', table_name);
    execute format('alter table public.%I add column if not exists plan_change_reason text', table_name);
  end loop;
end $$;

alter table public.city_services
  add column if not exists listing_type text not null default 'commercial',
  add column if not exists plan_type text,
  add column if not exists plan_status text not null default 'active',
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz,
  add column if not exists custom_features jsonb not null default '{}'::jsonb,
  add column if not exists carousel_photo_limit integer,
  add column if not exists gallery_photo_limit integer,
  add column if not exists featured_order integer,
  add column if not exists category_priority integer not null default 0,
  add column if not exists professional_photography_included boolean not null default false,
  add column if not exists photography_completed_at timestamptz,
  add column if not exists social_media_promotion_included boolean not null default false,
  add column if not exists social_media_publication_url text,
  add column if not exists advanced_report_enabled boolean not null default false,
  add column if not exists priority_support_enabled boolean not null default false,
  add column if not exists seasonal_campaign_enabled boolean not null default false,
  add column if not exists establishment_story_enabled boolean not null default false,
  add column if not exists commercial_notes text;
alter table public.city_services add column if not exists plan_change_reason text;

-- Migração segura dos planos antigos. Nenhum registro é promovido automaticamente para Ouro.
update public.restaurantes
set plan_type = case when plano = 'pro' then 'silver' else 'bronze' end,
    plan_started_at = coalesce(plan_started_at, created_at, now()),
    custom_features = coalesce(custom_features, '{}'::jsonb)
      || case when plano = 'pro' and coalesce(destaque, false)
           then '{"highlighted":true}'::jsonb else '{}'::jsonb end
where plan_type is null or plan_type not in ('bronze', 'silver', 'gold');

update public.pousadas
set plan_type = case when plano = 'pro' then 'silver' else 'bronze' end,
    plan_started_at = coalesce(plan_started_at, created_at, now()),
    custom_features = coalesce(custom_features, '{}'::jsonb)
      || case when plano = 'pro' and coalesce(destaque, false)
           then '{"highlighted":true}'::jsonb else '{}'::jsonb end
      || case when plano = 'pro' and nullif(trim(coalesce(historia, '')), '') is not null
           then '{"establishmentStory":true}'::jsonb else '{}'::jsonb end
where plan_type is null or plan_type not in ('bronze', 'silver', 'gold');

update public.city_services
set plan_type = case when plan = 'pro' then 'silver' else 'bronze' end,
    plan_started_at = coalesce(plan_started_at, created_at, now()),
    custom_features = coalesce(custom_features, '{}'::jsonb)
      || case when plan = 'pro' and coalesce(is_featured, false)
           then '{"highlighted":true}'::jsonb else '{}'::jsonb end
where plan_type is null or plan_type not in ('bronze', 'silver', 'gold');

-- Serviços públicos essenciais não dependem de assinatura comercial.
update public.city_services
set listing_type = 'public_service'
where is_emergency = true
   or lower(category) in ('saude', 'saúde', 'seguranca', 'segurança', 'hospital', 'delegacia', 'policia-militar', 'polícia militar', 'ubs');

do $$
declare
  table_name text;
begin
  foreach table_name in array array['restaurantes', 'pousadas', 'city_services'] loop
    execute format(
      'update public.%I set carousel_photo_limit = case
        when plan_type = ''bronze'' then 1
        when plan_type = ''silver'' then 1
        when plan_type = ''gold'' and carousel_photo_limit is not null then greatest(1, least(carousel_photo_limit, 30))
        else carousel_photo_limit
      end',
      table_name
    );
    execute format('alter table public.%I alter column plan_type set default ''bronze''', table_name);
    execute format('alter table public.%I alter column plan_type set not null', table_name);
    execute format('alter table public.%I drop constraint if exists %I', table_name, table_name || '_plan_type_check');
    execute format('alter table public.%I add constraint %I check (plan_type in (''bronze'', ''silver'', ''gold''))', table_name, table_name || '_plan_type_check');
    execute format('alter table public.%I drop constraint if exists %I', table_name, table_name || '_plan_status_check');
    execute format('alter table public.%I add constraint %I check (plan_status in (''active'', ''inactive'', ''trial'', ''expired'', ''suspended''))', table_name, table_name || '_plan_status_check');
    execute format('alter table public.%I drop constraint if exists %I', table_name, table_name || '_carousel_limit_check');
    execute format(
      'alter table public.%I add constraint %I check (
        carousel_photo_limit is null
        or (plan_type = ''bronze'' and carousel_photo_limit = 1)
        or (plan_type = ''silver'' and carousel_photo_limit = 1)
        or (plan_type = ''gold'' and carousel_photo_limit between 1 and 30)
      )',
      table_name,
      table_name || '_carousel_limit_check'
    );
    execute format('alter table public.%I drop constraint if exists %I', table_name, table_name || '_gallery_limit_check');
    execute format('alter table public.%I add constraint %I check (gallery_photo_limit is null or gallery_photo_limit between 0 and 60)', table_name, table_name || '_gallery_limit_check');
  end loop;
end $$;

alter table public.city_services drop constraint if exists city_services_listing_type_check;
alter table public.city_services add constraint city_services_listing_type_check
check (listing_type in ('public_service', 'commercial'));

create table if not exists public.plan_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('restaurant', 'lodging', 'city_service')),
  entity_id uuid not null,
  previous_plan text,
  new_plan text not null,
  previous_status text,
  new_status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  notes text,
  started_at timestamptz,
  ended_at timestamptz
);

alter table public.plan_history enable row level security;
grant select, insert on public.plan_history to authenticated;
revoke update, delete on public.plan_history from anon, authenticated;

drop policy if exists "plan_history admin read" on public.plan_history;
create policy "plan_history admin read" on public.plan_history
for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "plan_history admin insert" on public.plan_history;
create policy "plan_history admin insert" on public.plan_history
for insert to authenticated with check (public.is_admin(auth.uid()));

create or replace function public.record_plan_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity_name text := tg_argv[0];
begin
  if old.plan_type is distinct from new.plan_type or old.plan_status is distinct from new.plan_status then
    insert into public.plan_history (
      entity_type, entity_id, previous_plan, new_plan, previous_status, new_status,
      changed_by, reason, notes, started_at, ended_at
    ) values (
      entity_name, new.id, old.plan_type, new.plan_type, old.plan_status, new.plan_status,
      auth.uid(), new.plan_change_reason, new.commercial_notes, new.plan_started_at, new.plan_expires_at
    );
  end if;
  return new;
end;
$$;

create or replace function public.record_initial_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.plan_history (
    entity_type, entity_id, previous_plan, new_plan, previous_status, new_status,
    changed_by, reason, notes, started_at, ended_at
  ) values (
    tg_argv[0], new.id, null, new.plan_type, null, new.plan_status,
    auth.uid(), new.plan_change_reason, new.commercial_notes, new.plan_started_at, new.plan_expires_at
  );
  return new;
end;
$$;

revoke all on function public.record_plan_change() from public, anon, authenticated;
revoke all on function public.record_initial_plan() from public, anon, authenticated;

drop trigger if exists restaurantes_plan_history_trigger on public.restaurantes;
create trigger restaurantes_plan_history_trigger after update of plan_type, plan_status on public.restaurantes
for each row execute function public.record_plan_change('restaurant');
drop trigger if exists restaurantes_initial_plan_trigger on public.restaurantes;
create trigger restaurantes_initial_plan_trigger after insert on public.restaurantes
for each row execute function public.record_initial_plan('restaurant');

drop trigger if exists pousadas_plan_history_trigger on public.pousadas;
create trigger pousadas_plan_history_trigger after update of plan_type, plan_status on public.pousadas
for each row execute function public.record_plan_change('lodging');
drop trigger if exists pousadas_initial_plan_trigger on public.pousadas;
create trigger pousadas_initial_plan_trigger after insert on public.pousadas
for each row execute function public.record_initial_plan('lodging');

drop trigger if exists city_services_plan_history_trigger on public.city_services;
create trigger city_services_plan_history_trigger after update of plan_type, plan_status on public.city_services
for each row execute function public.record_plan_change('city_service');
drop trigger if exists city_services_initial_plan_trigger on public.city_services;
create trigger city_services_initial_plan_trigger after insert on public.city_services
for each row execute function public.record_initial_plan('city_service');

insert into public.plan_history (entity_type, entity_id, new_plan, new_status, notes, started_at, ended_at, changed_at)
select 'restaurant', id, plan_type, plan_status, 'Migração inicial para três planos', plan_started_at, plan_expires_at, coalesce(plan_started_at, created_at, now())
from public.restaurantes restaurant
where not exists (
  select 1 from public.plan_history history where history.entity_type = 'restaurant' and history.entity_id = restaurant.id
);

insert into public.plan_history (entity_type, entity_id, new_plan, new_status, notes, started_at, ended_at, changed_at)
select 'lodging', id, plan_type, plan_status, 'Migração inicial para três planos', plan_started_at, plan_expires_at, coalesce(plan_started_at, created_at, now())
from public.pousadas lodging
where not exists (
  select 1 from public.plan_history history where history.entity_type = 'lodging' and history.entity_id = lodging.id
);

insert into public.plan_history (entity_type, entity_id, new_plan, new_status, notes, started_at, ended_at, changed_at)
select 'city_service', id, plan_type, plan_status, 'Migração inicial para três planos', plan_started_at, plan_expires_at, coalesce(plan_started_at, created_at, now())
from public.city_services service
where not exists (
  select 1 from public.plan_history history where history.entity_type = 'city_service' and history.entity_id = service.id
);

create index if not exists restaurantes_plan_sort_idx
on public.restaurantes(plan_type, plan_status, featured_order, category_priority, updated_at desc)
where ativo = true;
create index if not exists pousadas_plan_sort_idx
on public.pousadas(plan_type, plan_status, featured_order, category_priority, updated_at desc)
where ativo = true;
create index if not exists city_services_plan_sort_idx
on public.city_services(listing_type, plan_type, plan_status, featured_order, category_priority, updated_at desc)
where is_active = true;
create index if not exists plan_history_entity_idx
on public.plan_history(entity_type, entity_id, changed_at desc);

-- Agregação horária e comparação com o período anterior para relatórios Ouro.
create table if not exists public.analytics_hourly_stats (
  event_date date not null,
  event_hour smallint not null check (event_hour between 0 and 23),
  establishment_id text not null,
  entity_type text not null,
  event_type text not null,
  event_count bigint not null default 0,
  primary key (event_date, event_hour, establishment_id, entity_type, event_type)
);

alter table public.analytics_hourly_stats enable row level security;
grant select on public.analytics_hourly_stats to authenticated;
revoke insert, update, delete on public.analytics_hourly_stats from anon, authenticated;
drop policy if exists "analytics_hourly_stats admin read" on public.analytics_hourly_stats;
create policy "analytics_hourly_stats admin read" on public.analytics_hourly_stats
for select to authenticated using (public.is_admin(auth.uid()));

create or replace function public.aggregate_analytics_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_time timestamp := new.created_at at time zone 'America/Fortaleza';
begin
  insert into public.analytics_daily_stats (
    event_date, establishment_id, entity_type, event_type, establishment_name,
    category, plan_type, event_count, updated_at
  ) values (
    local_time::date, new.establishment_id, new.entity_type, new.event_type,
    new.establishment_name, new.category, new.plan_type, 1, now()
  )
  on conflict (event_date, establishment_id, entity_type, event_type)
  do update set
    event_count = public.analytics_daily_stats.event_count + 1,
    establishment_name = coalesce(excluded.establishment_name, public.analytics_daily_stats.establishment_name),
    category = coalesce(excluded.category, public.analytics_daily_stats.category),
    plan_type = coalesce(excluded.plan_type, public.analytics_daily_stats.plan_type),
    updated_at = now();

  insert into public.analytics_hourly_stats (
    event_date, event_hour, establishment_id, entity_type, event_type, event_count
  ) values (
    local_time::date, extract(hour from local_time)::smallint, new.establishment_id,
    new.entity_type, new.event_type, 1
  )
  on conflict (event_date, event_hour, establishment_id, entity_type, event_type)
  do update set event_count = public.analytics_hourly_stats.event_count + 1;

  return new;
end;
$$;

insert into public.analytics_hourly_stats (
  event_date, event_hour, establishment_id, entity_type, event_type, event_count
)
select
  (created_at at time zone 'America/Fortaleza')::date,
  extract(hour from created_at at time zone 'America/Fortaleza')::smallint,
  establishment_id,
  entity_type,
  event_type,
  count(*)
from public.analytics_events
group by 1, 2, 3, 4, 5
on conflict (event_date, event_hour, establishment_id, entity_type, event_type)
do update set event_count = excluded.event_count;

create or replace function public.analytics_report_summary(p_since date default (current_date - 30))
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  period_days integer := greatest(current_date - p_since, 1);
  previous_since date := p_since - greatest(current_date - p_since, 1);
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
      ) from public.analytics_daily_stats where event_date >= p_since
    ),
    'previousTotals', (
      select jsonb_build_object(
        'total', coalesce(sum(event_count), 0),
        'views', coalesce(sum(event_count) filter (where event_type in ('card_view', 'page_view')), 0),
        'clicks', coalesce(sum(event_count) filter (where event_type not in ('card_view', 'page_view')), 0)
      ) from public.analytics_daily_stats where event_date >= previous_since and event_date < p_since
    ),
    'byEvent', coalesce((
      select jsonb_agg(to_jsonb(rows) order by rows.count desc) from (
        select event_type as event, sum(event_count)::bigint as count
        from public.analytics_daily_stats where event_date >= p_since group by event_type
      ) rows
    ), '[]'::jsonb),
    'byDay', coalesce((
      select jsonb_agg(to_jsonb(rows) order by rows.day desc) from (
        select event_date::text as day, sum(event_count)::bigint as count
        from public.analytics_daily_stats where event_date >= p_since group by event_date
      ) rows
    ), '[]'::jsonb),
    'byHour', coalesce((
      select jsonb_agg(to_jsonb(rows) order by rows.hour) from (
        select event_hour as hour, sum(event_count)::bigint as count
        from public.analytics_hourly_stats where event_date >= p_since group by event_hour
      ) rows
    ), '[]'::jsonb),
    'byEstablishment', coalesce((
      select jsonb_agg(to_jsonb(rows) order by rows.total desc) from (
        select
          establishment_id as id,
          coalesce(max(establishment_name), 'Estabelecimento') as name,
          coalesce(max(category), max(entity_type)) as category,
          coalesce(max(plan_type), 'bronze') as plan,
          coalesce(sum(event_count) filter (where event_date >= p_since and event_type in ('card_view', 'page_view')), 0)::bigint as views,
          coalesce(sum(event_count) filter (where event_date >= p_since and event_type not in ('card_view', 'page_view')), 0)::bigint as clicks,
          coalesce(sum(event_count) filter (where event_date >= p_since), 0)::bigint as total,
          coalesce(sum(event_count) filter (where event_date >= previous_since and event_date < p_since), 0)::bigint as "previousTotal",
          (
            select hourly.event_hour
            from public.analytics_hourly_stats hourly
            where hourly.establishment_id = stats.establishment_id
              and hourly.event_date >= p_since
            group by hourly.event_hour
            order by sum(hourly.event_count) desc, hourly.event_hour asc
            limit 1
          ) as "busiestHour",
          (
            select daily.event_date::text
            from public.analytics_daily_stats daily
            where daily.establishment_id = stats.establishment_id
              and daily.event_date >= p_since
            group by daily.event_date
            order by sum(daily.event_count) desc, daily.event_date desc
            limit 1
          ) as "busiestDay"
        from public.analytics_daily_stats stats
        where event_date >= previous_since
        group by establishment_id
      ) rows
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.analytics_report_summary(date) from public, anon;
grant execute on function public.analytics_report_summary(date) to authenticated;
create index if not exists analytics_hourly_stats_date_idx on public.analytics_hourly_stats(event_date desc, event_hour);
