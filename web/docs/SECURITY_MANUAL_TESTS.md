# Testes manuais de seguranca

Execute em ambiente local ou Preview protegido, nunca de forma destrutiva em producao.

1. Acesse `/admin` sem cookies: deve redirecionar para `/admin/login`.
2. Autentique um usuario que nao esteja em `admin_users`: deve receber acesso negado e logout.
3. Saia do painel e repita a URL pelo historico: a sessao nao deve voltar.
4. Envie entidade/UUID invalido por uma Server Action: deve retornar erro generico sem stack trace.
5. Abra diretamente o slug de qualquer restaurante ou pousada ativa: a página deve carregar, independentemente de dados comerciais antigos.
6. Adicione, reorganize e remova fotos: o servidor deve aplicar somente o limite técnico comum e preservar as fotos em caso de erro.
7. Tente ativar `highlighted`, `advancedReport` ou `listing_type` adulterando o formulario sem admin: RLS deve negar.
8. Envie analytics com `eventType` fora da allowlist: HTTP 400.
9. Envie analytics com UUID inexistente/inativo: HTTP 404.
10. Repita o mesmo clique rapidamente: somente uma janela deve ser contabilizada depois da migration.
11. Envie SVG, HTML renomeado, JPEG com assinatura falsa e imagem acima de 6 MB: todos devem falhar.
12. Teste `javascript:`, `data:`, `file:` e URL de host falso nos campos externos: a validacao deve falhar.
13. Cadastre texto contendo `<script>alert(1)</script>`: deve aparecer como texto, nunca executar.
14. Bloqueie GA4 no navegador: navegacao e CTAs devem continuar funcionando.
15. Indisponibilize o Supabase localmente: paginas devem mostrar fallback/erro amigavel sem dados internos.
16. Teste headers com `curl -I https://DOMINIO` e confirme CSP, HSTS, nosniff, referrer e anti-frame.
17. No Supabase SQL Editor, use o advisor de seguranca e confirme ausencia de tabelas publicas sem RLS.
18. Compare contagens de analytics antes/depois sem consultar ou apagar eventos individuais.
19. Configure ADMIN_SESSION_MAX_HOURS=12, autentique e confirme que uma sessao mais antiga e encerrada pelo middleware.
20. Envie POST /api/track sem JSON, com origem externa e com mais de 16 KB: espere 415, 403 e 413.
21. Confirme que um upload aceita no maximo 5 arquivos por lote, 6 MB por arquivo e somente JPG, PNG ou WebP validos.
22. Rode supabase/security-hardening.sql depois das migrations funcionais e verifique que clear_login_rate_limit nao pode ser chamado pela role anon.

## Configuracao de producao

- Mantenha SUPABASE_SERVICE_ROLE_KEY somente nas variaveis server-side da Vercel.
- Use uma chave aleatoria longa em ANALYTICS_HASH_SALT.
- Configure ADMIN_SESSION_MAX_HOURS entre 1 e 168; o padrao seguro da aplicacao e 12.
- Rode primeiro schema.sql, depois as migrations funcionais necessarias e por ultimo security-hardening.sql.
- Nao execute fix-missing-content.sql em producao; o arquivo legado esta bloqueado por ser destrutivo.

Os testes de acesso horizontal de futuros comerciantes so podem ser considerados aprovados depois que esse perfil e o relacionamento por estabelecimento existirem. Hoje apenas administradores globais acessam relatorios.
