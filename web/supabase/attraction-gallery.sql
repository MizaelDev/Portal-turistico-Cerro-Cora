alter table public.pontos_turisticos
  add column if not exists imagens_urls text[] not null default '{}';

alter table public.pontos_turisticos
  add column if not exists info_url text;

update public.pontos_turisticos
set imagens_urls = array[imagem_url]
where coalesce(array_length(imagens_urls, 1), 0) = 0
  and imagem_url is not null
  and imagem_url <> '';
