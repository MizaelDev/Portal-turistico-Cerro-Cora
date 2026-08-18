-- Paginas individuais opcionais para Servicos da Cidade.
-- Migration aditiva: preserva registros e imagens existentes.

alter table public.city_services
  add column if not exists cover_url text,
  add column if not exists gallery_alt_texts text[] not null default '{}',
  add column if not exists differentials text[] not null default '{}',
  add column if not exists additional_information text,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

comment on column public.city_services.cover_url is
  'Foto de capa opcional da pagina individual.';
comment on column public.city_services.gallery_alt_texts is
  'Textos alternativos na mesma ordem de gallery_urls.';
comment on column public.city_services.differentials is
  'Diferenciais exibidos somente na pagina individual.';
comment on column public.city_services.additional_information is
  'Informacoes adicionais opcionais da pagina individual.';
comment on column public.city_services.seo_title is
  'Titulo SEO opcional da pagina individual.';
comment on column public.city_services.seo_description is
  'Descricao SEO opcional da pagina individual.';