# Código legado fora da aplicação ativa

A aplicação publicada é `web/`, identificada pelo pacote `portal-cerro-cora`. A Root Directory da Vercel deve permanecer configurada como `web`.

Os itens abaixo estão versionados no repositório raiz, mas não são importados, compilados nem utilizados pelo portal Next.js:

- `api/`: mini-CRM Express/SQLite independente.
- `login.html`: demonstração estática de login.

`demo123`, presente no seed do mini-CRM e no HTML, é uma credencial de demonstração, não um segredo de produção. Mesmo assim, esses artefatos não devem ser publicados nem usados com dados reais.

Não foram apagados porque sua propriedade/uso histórico não foi comprovado. Como proteção operacional:

1. confirme `web` como Root Directory na Vercel;
2. não crie deployment a partir da raiz do repositório;
3. mantenha banco e variáveis do mini-CRM separados;
4. depois de confirmar que não há uso, mova o legado para outro repositório em uma tarefa específica e revisada.

A pasta local `academia-platform/` não faz parte dos arquivos rastreados pelo Git do portal e não deve ser adicionada novamente.
