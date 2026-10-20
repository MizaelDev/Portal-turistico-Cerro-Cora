# Variaveis de ambiente

Nunca registre valores reais neste arquivo.

| Variavel | Classe | Ambiente | Finalidade |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Publica | todos | URL canonica do portal |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Publica | todos | contato publico do portal |
| `NEXT_PUBLIC_SUPABASE_URL` | Publica | todos | URL publica do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publica | todos | chave anon protegida por RLS |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | Publica | todos | mapa publico |
| `OPENWEATHER_API_KEY` | Secreta | server production/preview | clima via `/api/weather`; nunca enviar ao navegador |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Publica | production/preview | identificador GA4 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secreta critica | server production/preview | insert validado de analytics; nunca usar no cliente |
| `ANALYTICS_HASH_SALT` | Secreta | server production/preview | hash pseudonimo de IP para abuso |
| `ANALYTICS_RETENTION_DAYS` | Privada | server production | prazo aprovado entre 30 e 1825 dias |
| `CRON_SECRET` | Secreta | server production | autentica o Cron de retenção; mínimo de 16 caracteres |

Regras:

- Somente variaveis deliberadamente publicas usam `NEXT_PUBLIC_`.
- Marcar `SUPABASE_SERVICE_ROLE_KEY`, `ANALYTICS_HASH_SALT`, `OPENWEATHER_API_KEY` e `CRON_SECRET` como Sensitive na Vercel.
- Usar valores diferentes por ambiente quando possivel.
- Depois de mudar uma variavel na Vercel, criar novo deployment; a mudanca nao afeta deployments antigos.
- Rotacionar imediatamente uma chave privada exposta em commit, screenshot, log ou mensagem.
