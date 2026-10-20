# Relatório de implementação da auditoria

Data da validação local e preparação de produção: 20/10/2026.

Escopo: aplicação `web` do Portal de Turismo de Cerro Corá. O código ainda não recebeu commit, push ou deploy. Em 20/10/2026, o operador configurou as variáveis necessárias na Vercel e aplicou no Supabase de produção as migrations `202610200001_security_followup.sql` e `202610200002_analytics_retention.sql`.

## Situação por achado

| ID | Situação local | Dependência externa |
| --- | --- | --- |
| SEC-01 / DEP-01 | Corrigido e validado: Next `15.5.28`, Sharp `0.35.5`, React `19.3.1`, PostCSS `8.5.31`; AVIF desativado; `shadcn` removido. | Publicar somente após revisão/CI. |
| API-01 | Corrigido e testado: salt/IP confiável, payload limitado, rate limit fail-closed e nenhuma inserção na falha. | Confirmar RPC/policies no Supabase Preview. |
| PRIV-01 | Controle central de consentimento, aceitar/recusar/reabrir/revogar e política pública implementados; scripts não iniciam antes da escolha. | Responsável deve aprovar conteúdo institucional/jurídico. |
| PRIV-02 | Rota, Cron e RPC de retenção preparados; prazo de 365 dias e segredos configurados. | Publicar a aplicação e confirmar a ativação do Cron. |
| DB-01 | Inventário, fluxo fresh/existente e consulta somente leitura entregues; migrations incrementais aplicadas em produção pelo operador. | Executar a verificação somente leitura pós-migration. |
| AUTH-01 | `clear_login_rate_limit` exige sessão administrativa; grants mínimos e `search_path` fixo; migration aplicada. | Validar perfis anon/comum/admin após publicar. |
| UPL-01 | JPEG/PNG/WebP reais, máximo 5 MB/24 MP, normalização WebP, resize e remoção de metadados testados. | Teste integrado de Storage depende de Preview. |
| STOR-01 | Migration idempotente do bucket aplicada pelo operador. | Confirmar upload integrado após publicar. |
| A11Y-01 | Lightbox com dialog acessível, foco contido/inicial, setas, Escape e retorno ao acionador; desktop/mobile testados. | Nenhuma para o comportamento testado. |
| OBS-01 | Logger estruturado e sanitizado adicionado aos fluxos de servidor. | Monitorar logs do Preview após publicar. |
| HDR-01 | `poweredByHeader` desativado, CSP/host do Storage restritos; cabeçalho validado em teste. | Conferir headers também na CDN do Preview. |
| KEY-01 | OpenWeather movido para rota server-side fixa, validada e cacheada; chave privada configurada na Vercel. | Testar a integração após publicar. |
| SEO-01 | Datas artificiais removidas do sitemap; datas reais permanecem nos registros que as possuem. | Nenhuma. |
| REPO-01 | `api/` e `login.html` classificados como legado e isolados operacionalmente; nada foi apagado. | Root Directory `web` confirmada na Vercel. |

## Evidências locais

- `npm ci`: concluído a partir do lockfile.
- `npm run lint`: aprovado sem warnings.
- `npm run typecheck`: aprovado.
- `npm test`: 31 testes aprovados (24 unitários/segurança e 7 do jogo existente).
- `npm run build`: aprovado; 24 páginas/rotas geradas ou compiladas.
- `npm run test:browser`: 6 cenários aprovados em Desktop Chrome e Pixel 7.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilidades.
- `git diff --check`: aprovado; somente avisos informativos de conversão LF/CRLF no Windows.

A auditoria completa ainda enumera 9 ocorrências (2 moderadas e 7 altas) em ferramentas de desenvolvimento, concentradas em `braces` e `postcss-selector-parser` por Tailwind 3/ESLint. A correção automática remanescente exige Tailwind 4 e foi adiada por ser migração principal/visual. Entradas desses processadores são arquivos controlados pelo repositório, e essas dependências não compõem o runtime publicado. Consulte `DEPENDENCY_SECURITY.md`.

## Limites da validação

- Não havia `supabase/config.toml`, Supabase CLI nem Docker ativo. As duas migrations incrementais foram executadas manualmente pelo operador no SQL Editor; a consulta de auditoria completa ainda deve ser executada após o deploy.
- As variáveis privadas novas não estão configuradas no ambiente local. Analytics próprio e clima devem falhar fechado/indisponível até a configuração.
- A inspeção do bundle encontrou somente o JWT público de papel `anon`, esperado para o cliente Supabase; não encontrou literal conhecido de service role ou outra chave privada.
- Vercel e Supabase receberam somente as configurações descritas acima. O código publicado ainda corresponde ao commit `1441672`; GitHub e deployment ainda não foram atualizados.

## Próximo passo controlado

Siga `RELEASE_CHECKLIST.md`: revisar o diff, executar CI em uma branch/PR, validar migrations e integrações em Supabase/Vercel Preview, obter as definições institucionais de privacidade e só então considerar produção.
