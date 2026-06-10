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
  on public.pontos_turisticos
  for select
  to anon, authenticated
  using (ativo = true or auth.role() = 'authenticated');

create policy "Authenticated insert pontos_turisticos"
  on public.pontos_turisticos
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

create policy "Authenticated update pontos_turisticos"
  on public.pontos_turisticos
  for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated delete pontos_turisticos"
  on public.pontos_turisticos
  for delete
  to authenticated
  using (auth.role() = 'authenticated');

create policy "Public read active pousadas"
  on public.pousadas
  for select
  to anon, authenticated
  using (ativo = true or auth.role() = 'authenticated');

create policy "Authenticated insert pousadas"
  on public.pousadas
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

create policy "Authenticated update pousadas"
  on public.pousadas
  for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated delete pousadas"
  on public.pousadas
  for delete
  to authenticated
  using (auth.role() = 'authenticated');

create policy "Public read active restaurantes"
  on public.restaurantes
  for select
  to anon, authenticated
  using (ativo = true or auth.role() = 'authenticated');

create policy "Authenticated insert restaurantes"
  on public.restaurantes
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

create policy "Authenticated update restaurantes"
  on public.restaurantes
  for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated delete restaurantes"
  on public.restaurantes
  for delete
  to authenticated
  using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('tourism', 'tourism', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read tourism files" on storage.objects;
drop policy if exists "Authenticated insert tourism files" on storage.objects;
drop policy if exists "Authenticated update tourism files" on storage.objects;
drop policy if exists "Authenticated delete tourism files" on storage.objects;

create policy "Public read tourism files"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'tourism');

create policy "Authenticated insert tourism files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'tourism' and auth.role() = 'authenticated');

create policy "Authenticated update tourism files"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'tourism' and auth.role() = 'authenticated')
  with check (bucket_id = 'tourism' and auth.role() = 'authenticated');

create policy "Authenticated delete tourism files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'tourism' and auth.role() = 'authenticated');
