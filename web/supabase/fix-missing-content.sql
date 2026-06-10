insert into storage.buckets (id, name, public)
values ('tourism', 'tourism', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read tourism files" on storage.objects;
drop policy if exists "Authenticated insert tourism files" on storage.objects;
drop policy if exists "Authenticated update tourism files" on storage.objects;
drop policy if exists "Authenticated delete tourism files" on storage.objects;

create policy "Public read tourism files"
  on storage.objects for select
  using (bucket_id = 'tourism');

create policy "Authenticated insert tourism files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'tourism');

create policy "Authenticated update tourism files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'tourism')
  with check (bucket_id = 'tourism');

create policy "Authenticated delete tourism files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tourism');

delete from public.pousadas
where nome in (
  'Pousada e Restaurante Seridó',
  'Colina dos Flamboyants',
  'Pousada do Teté',
  'Parque das Aroeiras',
  'Pousada Mirante',
  'Pousada Central',
  'Pousada Platô da Nascente'
);

insert into public.pousadas
  (nome, descricao, localizacao, distancia_centro, faixa_preco_min, faixa_preco_max, whatsapp, imagens_urls, ativo)
values
  ('Pousada e Restaurante Seridó', 'Tradição e praticidade no coração de Cerro Corá. Uma hospedagem completa com quartos confortáveis e restaurante no local.', 'Próximo ao centro', null, 220, 420, '5584999992001', array['/pousadas/POUSADA-SUICA-DO-SERIDO/serido-1.jpg','/pousadas/POUSADA-SUICA-DO-SERIDO/serido-2.jpg','/pousadas/POUSADA-SUICA-DO-SERIDO/serido-3.jpg','/pousadas/POUSADA-SUICA-DO-SERIDO/serido-4.jpg'], true),
  ('Colina dos Flamboyants', 'Onde o charme serrano encontra a alta gastronomia. A Colina oferece uma experiência exclusiva em Cerro Corá, unindo hospedagem de alto padrão a um restaurante no próprio local.', 'Área rural', '0,6 km do centro', 280, 560, '5584999992002', array['/pousadas/COLINA-DOS-Flamboyant/flamboyant-img.jpeg','/pousadas/COLINA-DOS-Flamboyant/colina-flanboyants-2.jpg','/pousadas/COLINA-DOS-Flamboyant/colina-flanboyants-3.jpg','/pousadas/COLINA-DOS-Flamboyant/colina-flanboyants-4.jpg'], true),
  ('Pousada do Teté', 'Hospedagem familiar no centro de Cerro Corá, com serviço de restaurante e pizzaria.', 'Próximo ao centro', null, 180, 340, '5584999992003', array['/pousadas/POUSADA-TETE/tete.jpg','/pousadas/POUSADA-TETE/tete-2.jpg','/pousadas/POUSADA-TETE/tete-3.jpg','/pousadas/POUSADA-TETE/tete-5.jpg'], true),
  ('Parque das Aroeiras', 'Refúgio natural no centro de Cerro Corá, com quartos aconchegantes, restaurante no local e área cercada de verde.', 'Próximo ao centro', null, 180, 340, '5584999992003', array['/pousadas/aroeiras/aroeiras-1.jpg','/pousadas/aroeiras/aroeiras-2.jpg','/pousadas/aroeiras/aroeiras-3.jpg','/pousadas/aroeiras/aroeiras-4.jpg'], true),
  ('Pousada Mirante', 'Hospedagem com vista panorâmica para o mirante de Cerro Corá, gastronomia regional, petiscos e silêncio restaurador.', 'Rota da nascente', null, 180, 340, '5584999992003', array['/pousadas/POUSADA-MIRANTE/mirante-4.jpg','/pousadas/POUSADA-MIRANTE/mirante-2.jpg','/pousadas/POUSADA-MIRANTE/mirante-3.jpg','/pousadas/POUSADA-MIRANTE/mirante-1.jpg'], true),
  ('Pousada Central', 'Pousada no centro da cidade, indicada para quem busca praticidade durante a estadia.', 'Rota da nascente', null, 180, 340, '5584999992003', array['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85','https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=900&q=85','https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=85'], true),
  ('Pousada Platô da Nascente', 'Chalés confortáveis com vista panorâmica, ideal para relaxar e aproveitar o clima serrano.', 'Rota da nascente', null, 180, 340, '5584999992003', array['/pousadas/Plato/plato-1.jpg','/pousadas/Plato/palto-2.jpg','/pousadas/Plato/plato-3.jpg','/pousadas/Plato/plato-4.jpg'], true);

delete from public.restaurantes
where nome in (
  'Açaí Bistrô',
  'Suíça da Serra',
  'Mirante bar e petiscaria',
  'Nordestino Bar e petiscaria',
  'Espetaria do Vaguinho',
  'Restaurante da galinha caipira',
  'Parque das Aroeiras',
  'Kiosque do Magão',
  'Encontro dos Amigos',
  'Café Bougainville',
  'Pousada Restaurante do Seridó'
);

insert into public.restaurantes
  (nome, descricao, categoria, horario_funcionamento, endereco, instagram, whatsapp, imagem_url, ativo)
values
  ('Açaí Bistrô', 'Cozinha regional autoral, massas e pratos quentes para noites frias.', 'restaurante', 'Ter. a sáb.: 18h às 23h | Dom.: 15h às 22h', 'Centro', '@acaibistrocc', '5584999991001', '/images/logo-bistro.jpeg', true),
  ('Suíça da Serra', 'Pratos completos, hambúrgueres, sobremesas e pizza.', 'restaurante', 'Ter. a dom.: 18h às 22h', 'Avenida principal', '@restaurantesuicadaserra', '5584999991002', '/banners/suica.jpg', true),
  ('Mirante bar e petiscaria', 'Pratos completos, hambúrgueres, sobremesas e petiscos.', 'restaurante', 'Sáb., dom. e feriados: 11h às 17h', 'Área rural', '@mirante_pousadaerestaurante', '5584999991002', '/banners/mirante.jpg', true),
  ('Nordestino Bar e petiscaria', 'Pratos completos, petiscos e bebidas.', 'bar', 'Seg. a dom.: 17h às 22h', 'Avenida principal', '@nordestinobarepetiscarias', '5584999991002', '/banners/nordestino.jpg', true),
  ('Espetaria do Vaguinho', 'Petiscos, bebidas, caldos e espetinhos.', 'bar', 'Seg. a sáb.: 10h30 às 22h', 'Avenida principal', '@espetariavaguinho', '5584999991002', '/banners/vaguinho.jpg', true),
  ('Restaurante da galinha caipira', 'Pratos completos, galinha caipira e comida regional.', 'restaurante', 'Seg. a sáb.: 10h30 às 22h', 'Avenida principal', '@brasadoserido', '5584999991002', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85', true),
  ('Parque das Aroeiras', 'Pratos completos, jantar, eventos e almoço.', 'restaurante', 'Qua. a sáb.: 11h30 às 14h | Dom.: 11h30 às 15h', 'Avenida principal', '@parquedasaroeirasrn', '5584999991002', '/banners/aroeiras.jpg', true),
  ('Kiosque do Magão', 'Hambúrgueres artesanais, molhos da casa e batatas rústicas.', 'lanchonete', 'Qua. a dom.: 18h às 00h', 'Praça central', '@kiosquedomagaooficial', '5584999991003', '/banners/magao.jpg', true),
  ('Encontro dos Amigos', 'Hambúrgueres artesanais, pizzas, açaí, sorvetes e delivery.', 'lanchonete', 'Ter. a dom.: 15h às 22h', 'Avenida principal', '@encontrodosamigoscc', '5584999991003', '/images/encontro.webp', true),
  ('Café Bougainville', 'Cafés especiais, chocolate quente, bolos e vista para o açude Eloi de Souza.', 'café', 'Todos os dias: 7h às 20h', 'Ao lado da ponte', '@cafebougainville_', '5584999991004', '/banners/cafe.jpg', true),
  ('Pousada Restaurante do Seridó', 'Pizzas, massas, jantar e almoço.', 'restaurante', 'Qui. a dom.: 18h às 23h30', 'Centro', '@seridopousadaerestaurante', '5584999991005', '/banners/pousada.jpg', true);
