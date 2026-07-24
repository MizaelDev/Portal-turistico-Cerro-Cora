-- Guia completo de Serviços da Cidade.
-- Migration idempotente: preserva os registros existentes e apenas amplia a estrutura.

create extension if not exists pgcrypto;

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  city_id uuid,
  name text not null,
  slug text not null,
  description text,
  icon text,
  accent text,
  listing_type text,
  parent_id uuid references public.service_categories(id) on delete restrict,
  parent_slug text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_categories
  add column if not exists description text,
  add column if not exists accent text,
  add column if not exists listing_type text,
  add column if not exists parent_id uuid references public.service_categories(id) on delete restrict,
  add column if not exists parent_slug text;

alter table public.city_services
  add column if not exists category_id uuid references public.service_categories(id) on delete set null,
  add column if not exists subcategory_id uuid references public.service_categories(id) on delete set null,
  add column if not exists listing_type text not null default 'commercial',
  add column if not exists short_description text,
  add column if not exists full_description text,
  add column if not exists services_offered text[] not null default '{}',
  add column if not exists special_status text,
  add column if not exists instagram text,
  add column if not exists instagram_url text,
  add column if not exists site_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists image_url text,
  add column if not exists photo_url text,
  add column if not exists logo_url text,
  add column if not exists image_type text not null default 'auto',
  add column if not exists alt_text text,
  add column if not exists details_enabled boolean not null default false,
  add column if not exists gallery_enabled boolean not null default false,
  add column if not exists gallery_urls text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists enabled_buttons text[] not null default '{}',
  add column if not exists important_message text,
  add column if not exists public_notice text,
  add column if not exists is_24h boolean not null default false,
  add column if not exists whatsapp_message text,
  add column if not exists is_published boolean not null default true,
  add column if not exists sort_order integer,
  add column if not exists featured_order integer,
  add column if not exists last_confirmed_at timestamptz;

alter table public.city_services drop constraint if exists city_services_listing_type_check;
alter table public.city_services add constraint city_services_listing_type_check
  check (listing_type in ('public_service', 'commercial'));

alter table public.city_services drop constraint if exists city_services_image_type_check;
alter table public.city_services add constraint city_services_image_type_check
  check (image_type in ('photo', 'logo', 'auto'));

alter table public.service_categories drop constraint if exists service_categories_listing_type_check;
alter table public.service_categories add constraint service_categories_listing_type_check
  check (listing_type is null or listing_type in ('public_service', 'commercial', 'mixed'));

create unique index if not exists service_categories_global_slug_idx
  on public.service_categories(slug)
  where city_id is null;

insert into public.service_categories
  (name, slug, description, icon, accent, listing_type, sort_order, is_active)
values
  ('Saúde e bem-estar', 'saude', 'Atendimento de saúde, cuidados pessoais e bem-estar.', 'heart-pulse', 'green', 'mixed', 10, true),
  ('Segurança e serviços públicos', 'servicos-publicos', 'Segurança, órgãos municipais e serviços de atendimento público.', 'shield', 'blue', 'public_service', 20, true),
  ('Mercados e compras', 'compras', 'Compras do dia a dia, vestuário e comércio local.', 'shopping-basket', 'amber', 'commercial', 30, true),
  ('Casa e construção', 'casa-construcao', 'Materiais, manutenção e profissionais para casa e construção.', 'hammer', 'terracotta', 'commercial', 40, true),
  ('Automotivo e mobilidade', 'automotivo', 'Abastecimento, manutenção de veículos e transporte local.', 'car', 'teal', 'commercial', 50, true),
  ('Financeiro e conveniência', 'financeiro', 'Bancos, pagamentos e serviços rápidos de apoio.', 'landmark', 'olive', 'commercial', 60, true),
  ('Serviços profissionais e educação', 'servicos-profissionais', 'Educação, assistência técnica e profissionais autônomos.', 'briefcase-business', 'wine', 'commercial', 70, true)
on conflict do nothing;

with subcategories(parent_slug, name, slug, sort_order) as (
  values
    ('saude','Hospital e maternidade','hospital-e-maternidade',1001),
    ('saude','UBS e postos de saúde','ubs-e-postos-de-saude',1002),
    ('saude','Farmácias','farmacias',1003),
    ('saude','Clínicas','clinicas',1004),
    ('saude','Dentistas','dentistas',1005),
    ('saude','Laboratórios','laboratorios',1006),
    ('saude','Fisioterapia','fisioterapia',1007),
    ('saude','Academias','academias',1008),
    ('saude','Nutricionistas','nutricionistas',1009),
    ('saude','Veterinárias','veterinarias',1010),
    ('saude','Pet shops','pet-shops',1011),
    ('saude','Salões de beleza','saloes-de-beleza',1012),
    ('saude','Barbearias','barbearias',1013),
    ('servicos-publicos','Delegacia','delegacia',2001),
    ('servicos-publicos','Polícia Militar','policia-militar',2002),
    ('servicos-publicos','Prefeitura','prefeitura',2003),
    ('servicos-publicos','Secretarias municipais','secretarias-municipais',2004),
    ('servicos-publicos','Conselho Tutelar','conselho-tutelar',2005),
    ('servicos-publicos','Cartórios','cartorios',2006),
    ('servicos-publicos','Correios','correios',2007),
    ('servicos-publicos','Serviços de emergência','servicos-de-emergencia',2008),
    ('servicos-publicos','Órgãos públicos','orgaos-publicos',2009),
    ('compras','Supermercados','supermercados',3001),
    ('compras','Mercadinhos','mercadinhos',3002),
    ('compras','Padarias','padarias',3003),
    ('compras','Lojas de roupas','lojas-de-roupas',3004),
    ('compras','Calçados','calcados',3005),
    ('compras','Móveis e eletrodomésticos','moveis-e-eletrodomesticos',3006),
    ('compras','Perfumarias e cosméticos','perfumarias-e-cosmeticos',3007),
    ('compras','Óticas','oticas',3008),
    ('compras','Eletrônicos','eletronicos',3009),
    ('compras','Papelarias','papelarias',3010),
    ('compras','Lojas de variedades','lojas-de-variedades',3011),
    ('casa-construcao','Materiais de construção','materiais-de-construcao',4001),
    ('casa-construcao','Materiais elétricos','materiais-eletricos',4002),
    ('casa-construcao','Materiais hidráulicos','materiais-hidraulicos',4003),
    ('casa-construcao','Madeireiras','madeireiras',4004),
    ('casa-construcao','Serralherias','serralherias',4005),
    ('casa-construcao','Vidraçarias','vidracarias',4006),
    ('casa-construcao','Móveis e decoração','moveis-e-decoracao',4007),
    ('casa-construcao','Pintores','pintores',4008),
    ('casa-construcao','Eletricistas','eletricistas',4009),
    ('casa-construcao','Encanadores','encanadores',4010),
    ('casa-construcao','Pedreiros','pedreiros',4011),
    ('casa-construcao','Outros prestadores da construção','outros-prestadores-da-construcao',4012),
    ('automotivo','Postos de combustível','postos-de-combustivel',5001),
    ('automotivo','Oficinas de carros','oficinas-de-carros',5002),
    ('automotivo','Oficinas de motos','oficinas-de-motos',5003),
    ('automotivo','Autopeças','autopecas',5004),
    ('automotivo','Borracharias','borracharias',5005),
    ('automotivo','Autoelétricas','autoeletricas',5006),
    ('automotivo','Lava-jatos','lava-jatos',5007),
    ('automotivo','Guinchos','guinchos',5008),
    ('automotivo','Táxis','taxis',5009),
    ('automotivo','Mototáxis','mototaxis',5010),
    ('automotivo','Transportes e fretamentos','transportes-e-fretamentos',5011),
    ('financeiro','Bancos','bancos',6001),
    ('financeiro','Lotéricas','lotericas',6002),
    ('financeiro','Caixas eletrônicos','caixas-eletronicos',6003),
    ('financeiro','Correspondentes bancários','correspondentes-bancarios',6004),
    ('financeiro','Contabilidade','contabilidade-financeiro',6005),
    ('financeiro','Seguros','seguros',6006),
    ('financeiro','Serviços financeiros','servicos-financeiros',6007),
    ('financeiro','Gráficas','graficas',6008),
    ('financeiro','Copiadoras','copiadoras',6009),
    ('servicos-profissionais','Escolas','escolas',7001),
    ('servicos-profissionais','Creches','creches',7002),
    ('servicos-profissionais','Cursos','cursos',7003),
    ('servicos-profissionais','Informática','informatica',7004),
    ('servicos-profissionais','Assistência técnica','assistencia-tecnica',7005),
    ('servicos-profissionais','Fotografia','fotografia',7006),
    ('servicos-profissionais','Advocacia','advocacia',7007),
    ('servicos-profissionais','Contabilidade','contabilidade-profissional',7008),
    ('servicos-profissionais','Engenharia','engenharia',7009),
    ('servicos-profissionais','Arquitetura','arquitetura',7010),
    ('servicos-profissionais','Marketing','marketing',7011),
    ('servicos-profissionais','Comunicação','comunicacao',7012),
    ('servicos-profissionais','Serviços gerais','servicos-gerais',7013),
    ('servicos-profissionais','Prestadores autônomos','prestadores-autonomos',7014)
)
insert into public.service_categories
  (name, slug, parent_id, parent_slug, icon, accent, listing_type, sort_order, is_active)
select
  subcategories.name,
  subcategories.slug,
  parent.id,
  parent.slug,
  parent.icon,
  parent.accent,
  parent.listing_type,
  subcategories.sort_order,
  true
from subcategories
join public.service_categories parent
  on parent.slug = subcategories.parent_slug
  and parent.parent_id is null
on conflict do nothing;

update public.city_services
set
  short_description = coalesce(short_description, description),
  photo_url = coalesce(photo_url, image_url),
  is_published = coalesce(is_published, is_active)
where true;

update public.city_services
set category = case
  when category in ('seguranca', 'emergencia') then 'servicos-publicos'
  when category = 'comercio_essencial' then 'compras'
  when category = 'transporte_apoio' then 'automotivo'
  else category
end;

update public.city_services service
set category_id = category.id
from public.service_categories category
where category.slug = service.category
  and category.parent_id is null
  and service.category_id is null;

update public.city_services
set subcategory = 'Hospital e maternidade',
    category = 'saude',
    listing_type = 'public_service'
where slug = 'hospital-maternidade-cerro-cora';

update public.city_services
set subcategory = 'Delegacia',
    category = 'servicos-publicos',
    listing_type = 'public_service'
where slug = 'delegacia-policia-cerro-cora';

create index if not exists service_categories_parent_order_idx
  on public.service_categories(parent_id, sort_order)
  where is_active = true;
create index if not exists city_services_public_directory_idx
  on public.city_services(is_active, is_published, category, sort_order, name);
create index if not exists city_services_subcategory_idx
  on public.city_services(subcategory);

alter table public.service_categories enable row level security;
alter table public.city_services enable row level security;

grant select on public.service_categories to anon, authenticated;
grant insert, update, delete on public.service_categories to authenticated;
grant select on public.city_services to anon, authenticated;
grant insert, update, delete on public.city_services to authenticated;

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

drop policy if exists "city_services public read active" on public.city_services;
create policy "city_services public read active"
on public.city_services for select
to anon, authenticated
using (is_active = true and is_published = true);

drop policy if exists "city_services admin write" on public.city_services;
create policy "city_services admin write"
on public.city_services for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
