# Portal Turístico Cerro Corá - RN

MVP profissional em Next.js 15 para divulgar Cerro Corá, a "Suíça do Seridó", com páginas turísticas, painel administrativo protegido, SEO, dados demonstrativos e integração preparada para Supabase e Vercel.

## Stack

- Next.js 15 + App Router
- TypeScript
- TailwindCSS
- Framer Motion
- Componentes estilo Shadcn/UI
- Supabase Auth e Database
- `@supabase/ssr` para sessão com cookies
- Deploy pronto para Vercel

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

Não configure chave service role neste projeto. Ele usa apenas a anon key e as permissões são controladas por Supabase Auth + RLS.

## Como conectar Supabase

1. Crie um projeto no Supabase.
2. Rode o SQL em `web/supabase/schema.sql` no SQL Editor.
3. Opcionalmente, rode `web/supabase/seed.sql` para inserir os dados iniciais do portal.
4. Em Authentication, crie um usuário com email e senha.
5. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Reinicie `npm run dev`.
7. Acesse `/admin/login` e entre com o usuário criado.

As tabelas usadas são:

- `pontos_turisticos`
- `pousadas`
- `restaurantes`

O site público lê apenas registros com `ativo = true`. O painel administrativo usa middleware para proteger `/admin/*` e as escritas passam por autenticação Supabase.

No cadastro de pousadas, o painel envia as imagens para o bucket público `tourism`. A primeira imagem da lista é usada como foto principal e as seguintes aparecem na galeria.

Se o banco estiver vazio, o painel também possui o botão **Repor dados padrão** para recriar os roteiros, pousadas e restaurantes que vieram no MVP.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Defina o root directory como `web`.
3. Configure as variáveis de ambiente.
4. Use build command `npm run build`.
5. Publique.

## SEO e performance

- Metadata dinâmica por página
- Open Graph e Twitter cards
- `sitemap.xml` e `robots.txt`
- Schema markup `TouristDestination` e `LocalBusiness`
- App Router com Server Components
- Imagens otimizadas com `next/image`
- UI responsiva, dark mode automático por sistema, busca global e WhatsApp flutuante

## Dados demonstrativos

Os dados base ficam em `web/src/lib/data.ts`. Quando o Supabase não estiver configurado, as páginas públicas usam esses dados como fallback para manter o MVP navegável.
