-- Atualização idempotente para bancos existentes.
-- Não cria usuários, não apaga conteúdo e não deve ser usada como baseline.
begin;

create or replace function public.clear_login_rate_limit(p_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  delete from public.login_rate_limits
  where identifier = left(p_identifier, 160);
end;
$$;

revoke all on function public.clear_login_rate_limit(text)
  from public, anon, authenticated;
grant execute on function public.clear_login_rate_limit(text) to authenticated;

-- O servidor normaliza uploads legítimos para WebP. Mantemos JPEG e PNG para
-- compatibilidade com objetos e ferramentas administrativas existentes.
update storage.buckets
set
  file_size_limit = 6291456,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'tourism';

commit;
