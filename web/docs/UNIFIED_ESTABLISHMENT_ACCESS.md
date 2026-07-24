# Acesso unificado dos estabelecimentos

Restaurantes e pousadas ativos recebem os mesmos recursos públicos: card, página individual, contatos, SEO, analytics, galeria e carrossel opcionais.

## Banco de dados

Execute `supabase/unified-establishment-access.sql` depois de gerar um backup do projeto Supabase. A migration é não destrutiva: adiciona `gallery_enabled` e `carousel_enabled`, atualiza RLS e marca as colunas comerciais antigas como deprecated.

As colunas antigas de plano continuam no banco para compatibilidade e auditoria histórica. A aplicação não lê nem grava esses campos. Não execute `commercial-platform.sql` ou `three-tier-plans.sql` em instalações novas; esses arquivos são apenas históricos.

## Mídia

- `gallery_enabled`: publica a galeria quando existem fotos.
- `carousel_enabled`: ativa o carrossel quando existem pelo menos duas fotos.
- Uma única imagem é renderizada de forma estática.
- O limite técnico comum é de 60 imagens por estabelecimento.
- Logo, capa e coleções existentes são preservadas.

## Ordenação

A ordem pública usa `featured_order` quando preenchido, nome em ordem alfabética e data de atualização apenas como desempate. Não existe prioridade por plano.

## Remoção definitiva futura

Antes de excluir colunas antigas, confirme com uma busca no repositório, nas policies, triggers e funções SQL que não há dependências. Faça backup e remova os campos em uma migration separada. Não apague `plan_type` dos registros históricos de analytics até definir uma política de retenção.
