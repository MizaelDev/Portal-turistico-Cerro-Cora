# Portal Turístico Cerro Corá - RN

MVP  em Next.js 15 para divulgar Cerro Corá, a "Suíça do Seridó", com páginas turísticas, painel administrativo protegido, SEO, dados  e integração preparada para Supabase e Vercel.

## Stack

- Next.js 15 + App Router
- TypeScript
- TailwindCSS
- Framer Motion
- Componentes próprios sobre Radix UI
- Supabase Auth e Database
- `@supabase/ssr` para sessão com cookies
- Vercel para deploy e tarefas agendadas

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
npm ci
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
OPENWEATHER_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
ANALYTICS_HASH_SALT=
SUPABASE_SERVICE_ROLE_KEY=
ANALYTICS_RETENTION_DAYS=
CRON_SECRET=
```

Analytics é opcional e permanece desligado até a escolha do visitante. Variáveis privadas nunca devem usar o prefixo `NEXT_PUBLIC_`. Consulte `web/docs/SECURITY_VARIABLES.md`.


## Como conectar Supabase

1. Crie um projeto Supabase isolado.
2. Para instalação nova, siga exatamente a ordem em `web/supabase/MIGRATION_INVENTORY.md`.
3. Para banco existente, não reaplique o schema. Execute primeiro `web/supabase/verification/read-only-security-audit.sql`, registre um baseline e aplique apenas migrations ausentes.
4. `seed.sql` é opcional, apaga conteúdo das tabelas principais e só pode ser usado em projeto novo/descartável.
5. Em Authentication, crie um usuário com email e senha.
6. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Reinicie `npm run dev`.
8. Acesse `/admin/login` e entre com o usuário criado.

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
- `city_services`
- `service_categories`
- tabelas agregadas e internas de analytics protegidas por RLS

## Verificações antes de revisar

```bash
cd web
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

O workflow de CI executa essas verificações sem segredos de produção e também roda os testes Playwright em Chromium. Testes de integração que escrevam no Supabase devem usar ambiente isolado e não fazem parte do conjunto unitário padrão.

## Deploy

- A Root Directory da Vercel deve ser `web`.
- A branch de produção deve ser `main` protegida por CI.
- O Cron de retenção exige `CRON_SECRET`, `ANALYTICS_RETENTION_DAYS` e service role somente no servidor.
- O conteúdo legado em `api/` e `login.html` não faz parte do deploy; consulte `web/docs/LEGACY_CODE.md`.
- Antes de publicar, siga `web/docs/RELEASE_CHECKLIST.md`; os avisos de dependências avaliados estão em `web/docs/DEPENDENCY_SECURITY.md`.




## SEO e performance

- Metadata dinâmica por página
- Open Graph e Twitter cards
- `sitemap.xml` e `robots.txt`
- Schema markup `TouristDestination` e `LocalBusiness`
- App Router com Server Components
- Imagens otimizadas com `next/image`
- UI responsiva, dark mode automático por sistema, busca global e WhatsApp flutuante


