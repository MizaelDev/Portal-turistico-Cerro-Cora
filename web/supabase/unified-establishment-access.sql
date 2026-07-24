-- Acesso unificado para restaurantes e pousadas.
-- Migration nao destrutiva: nao remove colunas, fotos, slugs, historicos ou metricas.
-- Recomendacao: gere um backup no Supabase antes de executar qualquer migration.

begin;

alter table public.restaurantes
  add column if not exists gallery_enabled boolean not null default true,
  add column if not exists carousel_enabled boolean not null default true,
  add column if not exists featured_order integer;

alter table public.pousadas
  add column if not exists gallery_enabled boolean not null default true,
  add column if not exists carousel_enabled boolean not null default true,
  add column if not exists featured_order integer;

update public.restaurantes
set gallery_enabled = coalesce(gallery_enabled, true),
    carousel_enabled = coalesce(carousel_enabled, true);

update public.pousadas
set gallery_enabled = coalesce(gallery_enabled, true),
    carousel_enabled = coalesce(carousel_enabled, true);

-- Registros ativos antigos continuam com pagina individual disponivel.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'restaurantes' and column_name = 'pagina_ativa'
  ) then
    execute 'update public.restaurantes set pagina_ativa = true where ativo = true';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pousadas' and column_name = 'pagina_ativa'
  ) then
    execute 'update public.pousadas set pagina_ativa = true where ativo = true';
  end if;
end $$;

create index if not exists restaurantes_public_order_idx
  on public.restaurantes(ativo, featured_order, nome);

create index if not exists pousadas_public_order_idx
  on public.pousadas(ativo, featured_order, nome);

alter table public.restaurantes enable row level security;
alter table public.pousadas enable row level security;

drop policy if exists "Public read active restaurantes" on public.restaurantes;
drop policy if exists "Admin read restaurantes" on public.restaurantes;
drop policy if exists "Admin insert restaurantes" on public.restaurantes;
drop policy if exists "Admin update restaurantes" on public.restaurantes;
drop policy if exists "Admin delete restaurantes" on public.restaurantes;

create policy "Public read active restaurantes"
  on public.restaurantes for select to anon, authenticated
  using (ativo = true);
create policy "Admin read restaurantes"
  on public.restaurantes for select to authenticated
  using (public.is_admin(auth.uid()));
create policy "Admin insert restaurantes"
  on public.restaurantes for insert to authenticated
  with check (public.is_admin(auth.uid()));
create policy "Admin update restaurantes"
  on public.restaurantes for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "Admin delete restaurantes"
  on public.restaurantes for delete to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Public read active pousadas" on public.pousadas;
drop policy if exists "Admin read pousadas" on public.pousadas;
drop policy if exists "Admin insert pousadas" on public.pousadas;
drop policy if exists "Admin update pousadas" on public.pousadas;
drop policy if exists "Admin delete pousadas" on public.pousadas;

create policy "Public read active pousadas"
  on public.pousadas for select to anon, authenticated
  using (ativo = true);
create policy "Admin read pousadas"
  on public.pousadas for select to authenticated
  using (public.is_admin(auth.uid()));
create policy "Admin insert pousadas"
  on public.pousadas for insert to authenticated
  with check (public.is_admin(auth.uid()));
create policy "Admin update pousadas"
  on public.pousadas for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "Admin delete pousadas"
  on public.pousadas for delete to authenticated
  using (public.is_admin(auth.uid()));

-- Marca colunas antigas como deprecated, sem apaga-las.
do $$
declare
  target_table text;
  target_column text;
  deprecated_columns text[] := array[
    'plano', 'plan', 'plan_type', 'plan_status', 'plan_started_at',
    'plan_expires_at', 'custom_features', 'carousel_photo_limit',
    'gallery_photo_limit', 'category_priority',
    'professional_photography_included', 'priority_support_enabled',
    'seasonal_campaign_enabled', 'advanced_report_enabled',
    'social_media_promotion_included', 'establishment_story_enabled',
    'commercial_notes', 'plan_change_reason', 'pagina_ativa'
  ];
begin
  foreach target_table in array array['restaurantes', 'pousadas', 'city_services'] loop
    foreach target_column in array deprecated_columns loop
      if exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = target_table
          and c.column_name = target_column
      ) then
        execute format(
          'comment on column public.%I.%I is %L',
          target_table,
          target_column,
          'DEPRECATED: mantida temporariamente para compatibilidade historica. Nao controla recursos da aplicacao.'
        );
      end if;
    end loop;
  end loop;
end $$;

-- Relatorios iguais para todos; plan_type permanece apenas no historico legado.
create or replace function public.analytics_report_summary(p_since date default (current_date - 30))
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
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
          coalesce(sum(event_count) filter (where event_date >= p_since and event_type in ('card_view', 'page_view')), 0)::bigint as views,
          coalesce(sum(event_count) filter (where event_date >= p_since and event_type not in ('card_view', 'page_view')), 0)::bigint as clicks,
          coalesce(sum(event_count) filter (where event_date >= p_since), 0)::bigint as total,
          coalesce(sum(event_count) filter (where event_date >= previous_since and event_date < p_since), 0)::bigint as "previousTotal",
          (
            select hourly.event_hour
            from public.analytics_hourly_stats hourly
            where hourly.establishment_id = stats.establishment_id and hourly.event_date >= p_since
            group by hourly.event_hour
            order by sum(hourly.event_count) desc, hourly.event_hour asc
            limit 1
          ) as "busiestHour",
          (
            select daily.event_date::text
            from public.analytics_daily_stats daily
            where daily.establishment_id = stats.establishment_id and daily.event_date >= p_since
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

alter table if exists public.analytics_events
  drop constraint if exists analytics_events_type_allowed;
alter table if exists public.analytics_events
  drop constraint if exists analytics_events_event_type_check;
alter table if exists public.analytics_events
  add constraint analytics_events_event_type_check check (
    event_type in (
      'card_view', 'page_view', 'whatsapp_click', 'map_click',
      'instagram_click', 'site_click', 'phone_click', 'reserve_click',
      'details_click', 'gallery_click', 'carousel_click', 'share_click', 'cta_click'
    )
  ) not valid;

alter table if exists public.establishment_metrics
  drop constraint if exists establishment_metrics_event_type_check;
alter table if exists public.establishment_metrics
  add constraint establishment_metrics_event_type_check check (
    event_type in (
      'card_view', 'page_view', 'whatsapp_click', 'map_click',
      'instagram_click', 'site_click', 'phone_click', 'reserve_click',
      'details_click', 'gallery_click', 'carousel_click', 'share_click', 'cta_click'
    )
  ) not valid;

commit;

-- Validacao sugerida apos executar:
-- select count(*) from public.restaurantes;
-- select count(*) from public.pousadas;
-- select id, nome, slug, gallery_enabled, carousel_enabled from public.restaurantes order by nome;
-- select id, nome, slug, gallery_enabled, carousel_enabled from public.pousadas order by nome;
