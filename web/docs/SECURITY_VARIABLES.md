# Variaveis de ambiente

Nunca registre valores reais neste arquivo.

| Variavel | Classe | Ambiente | Finalidade |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Publica | todos | URL canonica do portal |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Publica | todos | contato publico do portal |
| `NEXT_PUBLIC_SUPABASE_URL` | Publica | todos | URL publica do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publica | todos | chave anon protegida por RLS |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | Publica | todos | mapa publico |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | Publica, com quota | todos | clima; restringir por dominio no provedor quando suportado |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Publica | production/preview | identificador GA4 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreta critica | server production/preview | insert validado de analytics; nunca usar no cliente |
| `ANALYTICS_HASH_SALT` | Secreta | server production/preview | hash pseudonimo de IP para abuso |

Regras:

- Somente variaveis deliberadamente publicas usam `NEXT_PUBLIC_`.
- Marcar `SUPABASE_SERVICE_ROLE_KEY` e `ANALYTICS_HASH_SALT` como Sensitive na Vercel.
- Usar valores diferentes por ambiente quando possivel.
- Depois de mudar uma variavel na Vercel, criar novo deployment; a mudanca nao afeta deployments antigos.
- Rotacionar imediatamente uma chave privada exposta em commit, screenshot, log ou mensagem.
