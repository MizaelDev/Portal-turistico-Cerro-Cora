# Privacidade, analytics e retenção

Esta documentação descreve o comportamento técnico e não substitui avaliação jurídica.

## Coletas opcionais

Todas permanecem desativadas até `portal_analytics_consent_v1=granted` no navegador.

| Mecanismo | Dados técnicos | Destino |
| --- | --- | --- |
| Analytics próprio | tipo/id/nome/categoria do estabelecimento, evento, caminho sem query, identificador temporário de sessão, hash de IP, user-agent e referrer sanitizado | Supabase `analytics_events` |
| Google Analytics 4 | page view, caminho e eventos comerciais; configuração usa anonimização de IP | Google Analytics |
| Vercel Web Analytics | page view e dimensões agregadas fornecidas pelo serviço | Vercel |

Ao recusar, nenhuma dessas integrações é montada. Ao revogar, o portal remove o identificador e as marcas de deduplicação do `sessionStorage`, tenta remover cookies `_ga*`, atualiza o consentimento do GA e recarrega a página para descarregar scripts opcionais.

## Informações ainda necessárias

O responsável pelo portal deve fornecer e aprovar antes de considerar a política definitiva:

- identidade e contato do controlador;
- contato do encarregado/canal dos titulares;
- finalidade institucional e base legal;
- prazo de retenção aprovado;
- procedimento para acesso, correção, oposição e eliminação;
- confirmação contratual dos operadores Google, Vercel e Supabase.

Enquanto isso, o estado padrão permanece `denied`/não escolhido.

## Retenção técnica

1. Aplique `supabase/migrations/202610200002_analytics_retention.sql` em Preview isolado.
2. Defina `ANALYTICS_RETENTION_DAYS` somente depois da aprovação do prazo, entre 30 e 1825 dias.
3. Gere um `CRON_SECRET` aleatório de pelo menos 16 caracteres e marque-o como Sensitive na Vercel.
4. Confirme o Cron mensal `/api/cron/analytics-retention` no painel da Vercel.
5. Valide primeiro em Preview chamando a rota com `Authorization: Bearer ...` e conferindo apenas a contagem retornada.
6. Em produção, monitore o status do Cron e as contagens agregadas; não registre eventos individuais nem o segredo.

Rollback: remova o item `crons` do `vercel.json` ou desabilite o Cron no painel. Não reverta a função SQL enquanto houver um deployment que possa chamá-la.
