begin;

update public.service_categories
set
  name = 'Comércio e conveniência',
  description = 'Compras do dia a dia, produtos locais e comércio de conveniência.'
where slug = 'compras'
  and parent_id is null;

insert into public.service_categories
  (name, slug, parent_id, parent_slug, icon, accent, listing_type, sort_order, is_active)
select
  'Produtos artesanais',
  'produtos-artesanais',
  parent.id,
  parent.slug,
  parent.icon,
  parent.accent,
  parent.listing_type,
  3012,
  true
from public.service_categories parent
where parent.slug = 'compras'
  and parent.parent_id is null
on conflict do nothing;

with category as (
  select id
  from public.service_categories
  where slug = 'compras'
    and parent_id is null
  limit 1
), subcategory as (
  select id
  from public.service_categories
  where slug = 'produtos-artesanais'
  limit 1
)
update public.city_services
set
  category = 'compras',
  category_id = category.id,
  subcategory = 'Produtos artesanais',
  subcategory_id = subcategory.id,
  updated_at = now()
from category, subcategory
where lower(trim(public.city_services.name)) = 'picles do bezeril';

commit;