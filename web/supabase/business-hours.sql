-- Estrutura reutilizável para status automático de funcionamento.
-- Rode este arquivo no SQL Editor do Supabase antes de salvar horários pelo painel.

alter table if exists public.restaurantes
  add column if not exists business_hours jsonb;

alter table if exists public.pousadas
  add column if not exists business_hours jsonb;

alter table if exists public.city_services
  add column if not exists business_hours jsonb;
