# Inventário e aplicação de banco

O diretório raiz de `supabase/` contém o histórico legado de scripts manuais. Eles não comprovam o estado de produção e não devem ser reaplicados em lote.

## Instalação nova

Em um projeto vazio e isolado:

1. `schema.sql`
2. `commercial-platform.sql`
3. `city-services-guide.sql`
4. `unified-establishment-access.sql`
5. `three-tier-plans.sql`
6. `attraction-gallery.sql`
7. `attraction-info-url.sql`
8. `business-hours.sql`
9. `city-service-detail-pages.sql`
10. `restaurant-detail-pages.sql`
11. `restaurant-enhancements.sql`
12. `restaurant-price-value-range.sql`
13. `allow-restaurant-lunch-category.sql`
14. `products-artesanais.sql`
15. `security-hardening.sql`
16. `migrations/202610200001_security_followup.sql`
17. `migrations/202610200002_analytics_retention.sql`

Execute primeiro em ambiente descartável e valide com `verification/read-only-security-audit.sql`. `seed.sql` é opcional e destrutivo: ele apaga dados das três tabelas principais antes de inserir exemplos.

## Banco existente/produção

1. Não execute `schema.sql`, `seed.sql`, `fix-missing-content.sql` ou toda a lista acima.
2. Faça backup e registre o deployment/commit ativo.
3. Execute `verification/read-only-security-audit.sql` e compare schema, policies e funções com os scripts esperados.
4. Registre como baseline apenas o que já existe, sem reaplicar SQL.
5. Aplique individualmente, nesta ordem, somente as migrations ainda ausentes em `migrations/`.
6. Repita a consulta de verificação e os testes anônimo, autenticado comum e administrador.

## Scripts legados

- `fix-missing-content.sql`: contém `delete`; não executar em produção.
- `seed.sql`: contém `delete`; somente projeto vazio/descartável.
- `fix-rls-policies.sql`, `login-rate-limit.sql` e `city-services.sql`: incorporados ao schema atual; mantidos apenas como histórico/reparo dirigido.
- `security-hardening.sql`: consolida RLS, rate limit, auditoria e retenção anteriores às migrations versionadas.

As migrations versionadas novas são aditivas/idempotentes. A aplicação em Supabase continua pendente até ser feita em Preview isolado e, depois de aprovada, em produção.
