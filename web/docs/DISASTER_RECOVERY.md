# Recuperacao de desastre

## Objetivos a definir

- RPO: perda maxima de dados aceitavel.
- RTO: tempo maximo para restaurar o portal.
- Responsaveis: Supabase, Vercel, GitHub e comunicacao.

## Antes de migration

1. Confirmar projeto e ambiente selecionados.
2. Exportar schema/policies e gerar backup do banco pelo recurso disponivel no plano Supabase.
3. Inventariar objetos do bucket `tourism`; nao baixar para pasta publica do portal.
4. Registrar commit Git e deployment Vercel ativos.
5. Ler a migration e executar primeiro em projeto de teste quando disponivel.

## Banco

1. Colocar o painel em manutencao operacional (nao editar dados).
2. Restaurar backup em projeto isolado quando possivel.
3. Validar contagens, chaves estrangeiras, slugs, RLS, RPCs e usuario admin.
4. Testar leitura anonima e escrita administrativa.
5. Somente depois apontar a aplicacao para o ambiente restaurado e fazer novo deploy.

## Storage

1. Comparar inventario de URLs do banco com objetos do bucket.
2. Restaurar apenas objetos ausentes, preservando caminhos usados no banco.
3. Validar MIME, tamanho e policies antes de tornar o bucket acessivel.
4. Nao reutilizar arquivo de origem desconhecida sem validacao.

## Codigo e Vercel

1. Usar Instant Rollback para regressao apenas de codigo/config de deployment.
2. Para rollback duravel, redeploy do commit conhecido e corrija `main` com novo commit.
3. Mudancas de variavel exigem novo deploy.
4. Revogar e rotacionar segredos se houver suspeita de exposicao.

## Validacao final

- Home, gastronomia, hospedagem, roteiros e servicos carregam.
- Admin autentica e RLS permite apenas admin.
- Upload e remocao de uma imagem de teste funcionam.
- Relatorios leem agregados, mas anon nao consegue le-los.
- Logs nao exibem tokens, senhas ou service role.

Registre data, responsavel, backup usado, duracao e divergencias de cada exercicio de restauracao.
