# Portal Turístico Cerro Corá - RN

MVP  em Next.js 15 para divulgar Cerro Corá, a "Suíça do Seridó", com páginas turísticas, painel administrativo protegido, SEO, dados  e integração preparada para Supabase e Vercel.

## Stack

- Next.js 15 + App Router
- TypeScript
- TailwindCSS
- Framer Motion
- Componentes estilo Shadcn/UI
- Supabase Auth e Database
- `@supabase/ssr` para sessão com cookies
- 

## Principais telas

- Home com hero cinematográfico, destaques, clima, pousadas, gastronomia e galeria
- Roteiros com cards dos atrativos, mapa e seção de guias turísticos locais
- Festival de Inverno com banner, countdown, programação em teaser, atrações ocultas, mapa, galeria e contato
- Gastronomia com restaurantes, cafés, bares e lanchonetes
- Pousadas e chalés com galeria, WhatsApp, reserva, localização e faixa de preço
- Admin protegido para cadastrar, editar e excluir pontos turísticos, pousadas e restaurantes, com upload de fotos de pousadas para o Supabase Storage

## Como rodar

```bash
cd web
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Variáveis de ambiente

Copie `web/.env.example` para `web/.env.local` e preencha:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=5584999999999
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL=https://www.google.com/maps?q=Cerro%20Cor%C3%A1%20RN&output=embed
NEXT_PUBLIC_OPENWEATHER_API_KEY=
```



## Como conectar Supabase

1. Crie um projeto no Supabase.
2. Rode o SQL em `web/supabase/schema.sql` no SQL Editor.
3. Opcionalmente, rode `web/supabase/seed.sql` para inserir os dados iniciais do portal.
4. Em Authentication, crie um usuário com email e senha.
5. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Reinicie `npm run dev`.
7. Acesse `/admin/login` e entre com o usuário criado.

Depois de criar o usuário em Authentication, marque esse usuário como administrador no SQL Editor:

```sql
insert into public.admin_users (user_id)
values ('COLE_AQUI_O_USER_ID_DO_AUTH_USERS')
on conflict (user_id) do nothing;
```

Somente usuários cadastrados em `admin_users` podem criar, editar, excluir registros ou enviar imagens.

As tabelas usadas são:

- `pontos_turisticos`
- `pousadas`
- `restaurantes`
- `admin_users`




## SEO e performance

- Metadata dinâmica por página
- Open Graph e Twitter cards
- `sitemap.xml` e `robots.txt`
- Schema markup `TouristDestination` e `LocalBusiness`
- App Router com Server Components
- Imagens otimizadas com `next/image`
- UI responsiva, dark mode automático por sistema, busca global e WhatsApp flutuante


