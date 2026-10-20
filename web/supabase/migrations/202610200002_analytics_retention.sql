-- Prepara retenção; a execução periódica permanece protegida por service_role.
begin;

create or replace function public.purge_old_analytics_events(p_retention_days integer default 400)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count bigint;
begin
  if p_retention_days is null or p_retention_days < 30 or p_retention_days > 1825 then
    raise exception 'retention period out of range' using errcode = '22023';
  end if;

  delete from public.analytics_events
  where created_at < now() - make_interval(days => p_retention_days);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.purge_old_analytics_events(integer)
  from public, anon, authenticated;
grant execute on function public.purge_old_analytics_events(integer) to service_role;

commit;
