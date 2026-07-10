-- Rate limit persistente para login do painel administrativo.
-- Rode este arquivo no SQL Editor do Supabase se não quiser executar o schema.sql completo.

create table if not exists public.login_rate_limits (
  identifier text primary key,
  attempts integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

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

alter table public.login_rate_limits enable row level security;
revoke all on public.login_rate_limits from anon, authenticated;
