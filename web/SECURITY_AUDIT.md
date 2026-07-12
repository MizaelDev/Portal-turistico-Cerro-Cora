# Auditoria de seguranca

Data da revisao: 12/07/2026
Escopo: aplicacao `web`, SQL versionado, Supabase Auth/Database/Storage, Vercel e GA4.
Referencia: OWASP ASVS nivel 2, OWASP Top 10 e documentacao oficial de Next.js, Supabase e Vercel.

## Resumo executivo

O portal possui uma base adequada para operacao comercial: o admin e protegido por middleware e por verificacao server-side, as Server Actions exigem administrador e mesma origem, as tabelas publicas usam RLS e a service role aparece somente na rota server-side de analytics.

Foram corrigidos dois achados altos:

1. A API de analytics confiava em nome, categoria e plano enviados pelo navegador. Agora o servidor busca o cadastro ativo e deriva esses valores do Supabase, alem de validar o evento contra os recursos efetivos do plano.
2. Um script legado podia recriar policies de Storage permitindo escrita a qualquer usuario autenticado. Todas as policies versionadas relevantes agora exigem `is_admin(auth.uid())`; `security-hardening.sql` reaplica o estado seguro.

Nao foi encontrada service role no bundle, em variavel `NEXT_PUBLIC_` ou no historico Git pesquisado. Valores de `.env` nao foram copiados para este relatorio.

Esta auditoria nao acessou o painel remoto do Supabase nem da Vercel. Portanto, a configuracao efetiva de producao precisa ser comparada com os arquivos versionados antes do deploy.

## Arquitetura e fronteiras de confianca

```mermaid
flowchart LR
  V[Visitante anonimo] --> N[Next.js publico]
  A[Administrador] --> M[Middleware e Auth Supabase]
  M --> SA[Server Components e Server Actions]
  N --> RLS[Supabase Data API com anon key e RLS]
  SA --> RLS
  N --> T[/api/track]
  T --> SR[Supabase service role somente no servidor]
  N --> GA[Google Analytics 4]
  RLS --> DB[(Postgres)]
  SA --> ST[Storage tourism]
  V --> ST
  N --> EX[WhatsApp, Instagram, Maps e clima]
```

Dados publicos: cadastros ativos, imagens publicas, horarios e contatos comerciais.
Dados administrativos: itens inativos, notas comerciais, configuracoes de plano e usuarios admin.
Dados privados: eventos/relatorios de analytics, historico de planos, log administrativo e limites de login.
Segredos: service role e salt de analytics, apenas no ambiente server-side.

## Inventario auditado

Tabelas principais:

- `pontos_turisticos`, `pousadas`, `restaurantes`, `city_services`
- `admin_users`, `login_rate_limits`
- `service_categories`, `plan_history`
- `analytics_events`, `analytics_daily_stats`, `analytics_hourly_stats`
- `establishment_metrics` (legada)
- `admin_audit_log` e `analytics_rate_limits` (nova migration)

Bucket:

- `tourism`: leitura publica intencional; insert, update e delete somente para admin autenticado.

Entradas mutaveis:

- Server Actions em `src/app/admin/actions.ts`
- login em `src/app/admin/login/actions.ts`
- analytics em `src/app/api/track/route.ts`

## Achados e correcoes

### ALTO - Metricas comerciais adulteraveis

Local: `src/app/api/track/route.ts`
Impacto: um visitante podia atribuir nome, categoria ou plano falsos a um UUID e poluir relatorios comerciais.
Correcao: fonte confiavel server-side, cadastro ativo obrigatorio, allowlist de eventos e autorizacao por recurso efetivo do plano. Dados enviados pelo cliente sao ignorados.

### ALTO - Policy legada de Storage excessiva

Local: `supabase/fix-missing-content.sql`
Impacto: se executado isoladamente, qualquer usuario autenticado poderia inserir, substituir ou excluir imagens.
Correcao: policies exigem `public.is_admin(auth.uid())`; a migration de hardening remove e recria as policies seguras.

### MEDIO - Rate limit serverless e eventos repetidos

Local: `src/app/api/track/route.ts`, `supabase/security-hardening.sql`
Impacto: limites somente em memoria nao sao globais entre instancias Vercel.
Correcao: RPC distribuida, deduplicacao por janela e indice unico. O limite local permanece apenas como fallback durante migration/falha controlada.

### MEDIO - Validacao parcial de horarios e caminhos

Local: `src/app/admin/actions.ts`
Impacto: objetos de horario malformados e caminhos locais com segmentos de travessia poderiam chegar ao banco.
Correcao: schema estrutural de horarios, pares obrigatorios e bloqueio de `.`/`..`, barra invertida e byte nulo.

### MEDIO - Regras de midia dependiam parcialmente da interface

Local: `src/app/admin/actions.ts`
Impacto: requisicoes adulteradas podiam tentar gravar galerias acima do limite comercial.
Correcao: o servidor busca plano/limites para alteracoes de galeria e bloqueia novas fotos incompatíveis ao salvar. Downgrade preserva os arquivos existentes, mas impede novas adicoes.

### MEDIO - Log administrativo ausente

Local: `supabase/security-hardening.sql`
Impacto: mudancas criticas tinham rastreabilidade limitada.
Correcao: log imutavel de insert/update/delete nas tabelas centrais, legivel somente por admin e sem payload integral.

### MEDIO - Ausencia de MFA e reautenticacao critica

Estado: risco aceito temporariamente.
Impacto: uma sessao admin comprometida permanece suficiente para mudancas destrutivas.
Recomendacao: habilitar MFA no Supabase para todos os administradores e exigir nova verificacao antes de remover admin, exportar dados ou realizar exclusoes em massa.

### MEDIO - Concorrencia de edicao

Estado: risco residual.
Impacto: dois administradores podem sobrescrever alteracoes sem aviso.
Recomendacao: enviar `updated_at` no formulario e atualizar com condicao `.eq("updated_at", valorOriginal)`.

### MEDIO - Backup remoto nao verificado

Estado: requer verificacao humana.
Impacto: perda de banco ou Storage pode nao ter RPO/RTO conhecido.
Recomendacao: executar o procedimento em `docs/DISASTER_RECOVERY.md` e registrar um teste de restauracao.

### BAIXO - CSP ainda usa `unsafe-inline`

Local: `next.config.mjs`
Contexto: necessario no estado atual para scripts/estilos do Next.js e GA4. `unsafe-eval` fica restrito ao desenvolvimento.
Recomendacao: migrar futuramente para nonce por requisicao e validar primeiro com CSP Report-Only.

### BAIXO - Payload administrativo amplo

Local: `src/app/admin/page.tsx`
Contexto: a pagina server-side protegida consulta `select("*")` e envia os registros ao dashboard cliente.
Impacto: nao ha exposicao anonima, mas futuros perfis colaboradores receberiam campos alem do necessario.
Recomendacao: antes de criar perfil de comerciante/colaborador, implementar DTOs e escopo por estabelecimento.

## Controles confirmados

- `/admin/:path*` protegido por middleware, `auth.getUser()` e RPC `is_admin`.
- Server Actions repetem autenticacao/autorizacao e validam origem.
- Cookies de sessao definidos como HttpOnly, SameSite Lax e Secure em producao.
- Login usa mensagem generica e rate limit persistente com fallback.
- RLS de conteudo publico limita leitura a registros ativos; escrita exige admin.
- Analytics e relatorios nao possuem leitura anonima.
- Upload aceita apenas JPEG, PNG e WebP, valida assinatura, limita 6 MB/arquivo e 10 arquivos/requisicao, usa UUID e rollback parcial.
- SVG, HTML, executaveis e extensoes nao reconhecidas sao rejeitados.
- Links administrativos aceitam HTTPS e hosts especificos para Instagram/Maps.
- Headers incluem CSP, HSTS, anti-frame, nosniff, referrer e permissions policy.
- Consultas publicas possuem limites e timeout.
- Paginas Bronze antigas sao negadas pelas regras efetivas de plano.
- Plano Prata nao possui carrossel, conforme a decisao comercial mais recente; apenas Ouro possui.

## Verificacoes executadas

- `npm run lint`: aprovado, zero warnings.
- `npm test`: 21 testes aprovados.
- `npm run build`: aprovado, 22 paginas geradas.
- `npm audit --json`: zero vulnerabilidades conhecidas nas 793 dependencias contabilizadas.
- Teste HTTP local: Home 200, `/admin` 307 para login, payload de analytics invalido 400.
- Headers locais confirmados: CSP, HSTS, X-Frame-Options e demais headers configurados.

## Riscos que exigem revisao humana

- Ativar MFA e revisar lista de administradores no Supabase Auth.
- Confirmar policies efetivas no banco remoto com o SQL de checklist.
- Configurar Deployment Protection para previews na Vercel.
- Revisar acessos de equipe ao Supabase, Vercel, GitHub e GA4.
- Definir prazo juridico de retencao de analytics e politica de privacidade/LGPD.
- Verificar se textos livres podem conter nomes de pessoas antes de enviá-los ao GA4; atualmente somente dados comerciais estruturados devem ser enviados.
- Testar restauracao de banco e Storage, nao apenas existencia de backup.

## Referencias

- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Next.js Authentication](https://nextjs.org/docs/app/guides/authentication)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)

## Rollback de codigo

1. Nao execute SQL sem backup.
2. Registre o hash do commit/deployment atual.
3. Para codigo, use Instant Rollback da Vercel ou redeploy do commit anterior.
4. Para SQL, siga os passos comentados em `docs/DISASTER_RECOVERY.md`; nao remova tabelas de auditoria/analytics sem exportacao.
5. Se a nova coluna `dedupe_key` ainda nao existir, a rota possui fallback temporario e continua registrando eventos sem deduplicacao distribuida.
