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
| Frontend  | Vercel ou Netlify        | Free tier, build automático a partir do GitHub |
| Backend   | Render (free tier)       | Dorme após inatividade — ok para demo |
| Banco     | Neon ou Supabase (Postgres free tier) | Portátil, dá para exportar via `pg_dump` depois |

Passos gerais:

1. Suba o repositório no GitHub.
2. Crie um banco no Neon/Supabase e rode as migrations (`npm run migrate` apontando `DATABASE_URL` para ele).
3. Deploy do `apps/api` no Render, apontando `DATABASE_URL` para o Postgres gerenciado.
4. Deploy do `apps/web` no Vercel/Netlify, configurando a variável de proxy/API para a URL pública da API (ajustar `vite.config.ts` ou usar uma env `VITE_API_URL` quando for produção).

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
