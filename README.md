# Radar Sebrae

Sistema de radar dinâmico para avaliação de municípios por período, com cadastro de municípios e de indicadores totalmente configuráveis.

## Stack

- **Frontend:** React + Vite + TypeScript, Chart.js (radar), react-router-dom
- **Backend:** Node.js + Express + TypeScript, PostgreSQL (`pg`)
- **Banco:** PostgreSQL (schema em `db/migrations`)
- **Monorepo:** npm workspaces (`apps/web`, `apps/api`, `packages/shared`)

## Estrutura

```
radar-sebrae/
├── apps/
│   ├── web/     # frontend (React)
│   └── api/     # backend (Express)
├── packages/
│   └── shared/  # tipos TypeScript compartilhados
├── db/
│   └── migrations/
└── docker-compose.yml
```

## Rodando localmente (sem Docker)

Pré-requisitos: Node 20+, PostgreSQL rodando localmente (ou use só o serviço `db` do Docker Compose: `docker compose up db`).

```bash
npm install
cp apps/api/.env.example apps/api/.env
# edite apps/api/.env com a sua DATABASE_URL

npm run build --workspace=packages/shared
npm run migrate
npm run dev:api    # http://localhost:3333
```

Em outro terminal:

```bash
npm run dev:web     # http://localhost:5173
```

## Rodando tudo com Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:3333/api/health
- Postgres: localhost:5432 (usuário/senha `radar`)

As migrations rodam automaticamente ao subir o container da API.

## Deploy gratuito (fase de demonstração / venda)

| Camada    | Serviço sugerido        | Observação |
|-----------|--------------------------|------------|
| Frontend  | Vercel                   | Free tier, build automático a partir do GitHub (`vercel.json` já configurado) |
| Backend   | Render (free tier)       | Dorme após inatividade — ok para demo (`render.yaml` já configurado) |
| Banco     | Neon (Postgres free tier) | Portátil, dá para exportar via `pg_dump` depois |

### Passo a passo

1. **Banco (Neon)** — crie uma conta em [neon.tech](https://neon.tech), crie um projeto `radarhub` e copie a *connection string* (formato `postgres://usuario:senha@host/dbname?sslmode=require`).
2. **Rodar as migrations no Neon** — localmente:
   ```bash
   DATABASE_URL="<connection string do Neon>" npm run migrate
   ```
3. **API (Render)** — em [render.com](https://render.com), "New" → "Blueprint", conecte o repositório `RadarHub` do GitHub. O Render detecta o `render.yaml` automaticamente e cria o serviço `radarhub-api`. Configure as variáveis de ambiente pedidas:
   - `DATABASE_URL`: a connection string do Neon
   - `CORS_ORIGIN`: a URL que o Vercel vai gerar para o frontend (pode ajustar depois do passo 4)
4. **Frontend (Vercel)** — em [vercel.com](https://vercel.com), "Add New" → "Project", importe o repositório `RadarHub` (o `vercel.json` na raiz já configura build/output). Configure a variável de ambiente:
   - `VITE_API_URL`: `https://radarhub-api.onrender.com/api` (URL gerada pelo Render + `/api`)
5. Volte no Render e atualize `CORS_ORIGIN` com a URL final do Vercel (ex: `https://radarhub.vercel.app`), assim a API só aceita requisições do seu frontend.

O plano free do Render "dorme" a API após ~15 min de inatividade — a primeira requisição depois disso demora alguns segundos para acordar. Normal em demonstrações.

## Migrando para o servidor do cliente

Quando o projeto for vendido, o `docker-compose.yml` já empacota banco, API e frontend prontos para rodar em qualquer VPS com Docker:

```bash
docker compose up -d --build
```

Para levar os dados do Postgres gratuito (Neon/Supabase) para o servidor do cliente:

```bash
pg_dump "postgres://usuario:senha@host-antigo/radar_sebrae" > backup.sql
psql "postgres://radar:radar@localhost:5432/radar_sebrae" < backup.sql
```

## Próximos passos possíveis (fora do escopo v1)

- Autenticação e perfis de usuário (Admin/Consulta)
- Histórico completo de avaliações por indicador
- Filtros avançados no ranking (por estado, por período)
