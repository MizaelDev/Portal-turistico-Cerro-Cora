# Checklist de seguranca antes do deploy

## Codigo

- [ ] Revisar `git diff -- web` e separar alteracoes nao relacionadas.
- [ ] `npm run lint` sem erros ou warnings.
- [ ] `npm test` sem falhas.
- [ ] `npm run build` concluido.
- [ ] `npm audit --omit=dev` sem vulnerabilidade alta/critica.
- [ ] Confirmar que nenhum `.env`, dump, token ou chave foi adicionado ao Git.

## Supabase

- [ ] Gerar backup/snapshot antes da migration.
- [ ] Executar `schema.sql`, `commercial-platform.sql`, `three-tier-plans.sql` apenas na ordem documentada quando necessario.
- [ ] Revisar e executar `security-hardening.sql` no SQL Editor.
- [ ] Confirmar RLS habilitada em todas as tabelas expostas.
- [ ] Confirmar leitura anonima somente de registros ativos.
- [ ] Confirmar que insert/update/delete de conteudo e Storage exigem `is_admin(auth.uid())`.
- [ ] Confirmar que anon/authenticated nao possuem INSERT em `analytics_events`.
- [ ] Confirmar que relatorios, logs e historico nao possuem SELECT anonimo.
- [ ] Validar administradores em `admin_users` e remover contas antigas manualmente.
- [ ] Habilitar MFA para administradores.
- [ ] Configurar Site URL e Redirect URLs de recuperacao para o dominio de producao.

## Vercel

- [ ] Variaveis privadas marcadas como Sensitive e sem prefixo `NEXT_PUBLIC_`.
- [ ] Variaveis configuradas separadamente em Production/Preview/Development.
- [ ] Novo deploy realizado depois de qualquer mudanca de ambiente.
- [ ] Standard Deployment Protection habilitada para previews.
- [ ] Git fork protection habilitada.
- [ ] Acesso da equipe revisado.
- [ ] Dominio canonico coincide com `NEXT_PUBLIC_SITE_URL`.

## Teste manual

- [ ] Visitante em `/admin` e redirecionado ao login.
- [ ] Usuario autenticado sem `admin_users` nao entra.
- [ ] Logout invalida a sessao e voltar no navegador nao reabre o painel.
- [ ] Bronze nao abre URL individual nem adiciona galeria.
- [ ] Prata abre pagina/galeria, mas nao carrossel.
- [ ] Ouro respeita limites configurados.
- [ ] Servico publico continua visivel sem assinatura.
- [ ] Upload invalido, SVG e arquivo acima de 6 MB sao rejeitados.
- [ ] Evento de analytics com UUID falso retorna 404 e nao aparece no relatorio.
- [ ] Paginas publicas continuam funcionando com GA4 bloqueado.
- [ ] Tema claro/escuro e embeds funcionam com CSP.

## Operacao

- [ ] Responsavel e prazo de retencao de analytics definidos.
- [ ] Politica de privacidade revisada por responsavel juridico/LGPD.
- [ ] Alertas de erro do Supabase e Vercel configurados.
- [ ] Restauracao de banco e Storage testada e registrada.
- [ ] Procedimento de incidente e rotacao de chaves conhecido por pelo menos duas pessoas.
