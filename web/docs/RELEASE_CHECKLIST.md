# Checklist de revisão, publicação e rollback

O código desta auditoria ainda está no repositório local. Em 20/10/2026, as variáveis de produção foram configuradas na Vercel e as duas migrations incrementais abaixo foram aplicadas manualmente no Supabase de produção; commit, push e deploy ainda não foram executados.

## Supabase Preview/isolado

1. Faça backup e registre o estado atual com `supabase/verification/read-only-security-audit.sql`.
2. Aplique, nessa ordem, apenas migrations ainda ausentes:
   - `supabase/migrations/202610200001_security_followup.sql`
   - `supabase/migrations/202610200002_analytics_retention.sql`
3. Repita a consulta somente leitura e teste como `anon`, autenticado comum e administrador.
4. Confirme que `clear_login_rate_limit` falha para usuário comum e funciona após login de administrador.
5. Confirme upload de JPEG, PNG e WebP e rejeição de formato/tamanho inválido. Não use dados reais no teste.
6. Só depois de aprovação repita o procedimento, com backup novo, no banco de produção.

Rollback SQL deve ser dirigido, não por reaplicação do schema. Se a mudança do bucket causar regressão, restaure no painel os valores anteriores registrados no passo 1. Se a função de limpeza precisar ser desativada, desabilite primeiro o Cron e revogue `execute` de `service_role`; não apague dados nem tabelas.

## Vercel Preview

1. Confirme Root Directory `web` e Node.js 24.
2. Configure como segredos: `SUPABASE_SERVICE_ROLE_KEY`, `ANALYTICS_HASH_SALT`, `OPENWEATHER_API_KEY` e `CRON_SECRET`.
3. Configure `ANALYTICS_RETENTION_DAYS` apenas após aprovação do prazo. `ANALYTICS_HASH_SALT` deve ter ao menos 32 caracteres e `CRON_SECRET`, ao menos 16.
4. Remova a antiga variável pública de clima `NEXT_PUBLIC_OPENWEATHER_API_KEY`, se existir.
5. Valide no Preview: CSP/headers, clima, escolha e revogação de consentimento, analytics próprio, login/admin, upload e lightbox em desktop/mobile.
6. Confirme o Cron mensal e sua autenticação por `Authorization: Bearer` sem registrar o segredo.

Rollback da aplicação: promova novamente o último deployment aprovado. Para interromper retenção, desabilite o Cron antes do rollback. Para interromper analytics imediatamente, remova ou invalide as variáveis privadas; o endpoint falha fechado com `503`.

## GitHub

O workflow `.github/workflows/web-ci.yml` só passará a existir no GitHub depois de revisão, commit e push. Proteja `main` exigindo o job `Web CI / validate`. O workflow usa permissões somente de leitura e não recebe segredos de produção.

Antes do commit, confirme que `.env`, `.env.local`, resultados do Playwright e artefatos de build continuam ignorados.
