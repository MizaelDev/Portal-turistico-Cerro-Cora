# Segurança de dependências

Revisão local realizada em 19/10/2026. Este registro descreve o lockfile desta alteração; não comprova a versão atualmente publicada na Vercel.

## Versões resolvidas

- `next` e `eslint-config-next`: `15.5.28`
- `react` e `react-dom`: `19.3.1`
- `sharp`: `0.35.5`
- `postcss`: `8.5.31`, incluindo a dependência interna do Next por `overrides`
- `shadcn`: removido; o único import residual de CSS também foi removido

## Avisos avaliados

| Componente | Aviso | Condição e tratamento |
| --- | --- | --- |
| Next.js | `GHSA-2xp9-vwfh-vxw4` | RCE não autenticada no otimizador quando AVIF é processado; afeta Next `<15.5.24`. Atualizado para `15.5.28` e AVIF retirado dos formatos do otimizador. |
| Next.js | `GHSA-p293-qw3h-jr36` / `CVE-2026-75604` | RCE em servidor hospedado no Windows; afeta Next `<15.5.24`. Atualizado para `15.5.28`. A produção esperada é Vercel/Linux, mas o ambiente local Windows também deixa de usar a versão afetada. |
| Next.js/React | `GHSA-9qr9-h5gf-34mp` / `CVE-2025-55182` | RCE em React Server Components. A linha Next 15 foi corrigida em `15.5.7`; React afetado era `19.0.0`, `19.1.0`, `19.1.1` e `19.2.0`. As versões resolvidas estão posteriores. |
| Next.js | `GHSA-vcvr-r3jv-pc5j` / `CVE-2026-94545` | Afeta apenas Next `>=16.2.0 <16.3.6` usando `next/og` com entrada não confiável. O portal usa Next 15 e não usa `next/og`; achado não aplicável. |
| Sharp | `GHSA-wq5f-xc86-pv6w` / `CVE-2026-96889` | Vulnerabilidade do `librsvg` em Sharp `<0.35.5`, com possível RCE em condições específicas no Linux/glibc. Atualizado para `0.35.5`. Uploads aceitam somente assinatura real de JPEG/PNG/WebP antes de chamar Sharp; SVG, AVIF, GIF e formatos disfarçados são rejeitados. |
| PostCSS | `GHSA-fxqj-rqcc-2cmp` / `CVE-2026-69153` e avisos relacionados `GHSA-6g55-p6wh-862q`, `GHSA-r28c-9q8g-f849`, `GHSA-qx2v-qp2m-jg93` | Versões até `8.5.22` são afetadas pelo aviso residual. O lockfile força `8.5.31`, inclusive sob Next, sem troca de versão principal. |

Não foi encontrada evidência de exploração no portal. Os itens acima foram tratados como exposição de versão e condição de uso, não como incidente confirmado.

## Auditoria npm

- `npm audit --omit=dev --audit-level=high`: zero vulnerabilidades.
- A auditoria completa ainda relata avisos de negação de serviço em `braces` e `postcss-selector-parser`, alcançados pelas ferramentas de build `tailwindcss@3.4.19` e `eslint-config-next`.
- Essas bibliotecas processam somente CSS, padrões e arquivos controlados pelo repositório durante lint/build; não integram o servidor de produção gerado.
- O `npm audit` informa que a remoção total exige `tailwindcss@4`, uma migração principal com impacto amplo. Ela foi deliberadamente adiada para não misturar uma migração visual com esta correção de segurança. O CI bloqueia achados altos de runtime com `npm audit --omit=dev --audit-level=high`.

Revisar essa exceção em uma tarefa própria de migração para Tailwind 4. Não usar `npm audit fix --force` sem validar todo o CSS e os componentes.
