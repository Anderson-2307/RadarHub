FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm install --workspace=packages/shared --workspace=apps/api
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api ./apps/api
COPY db ./db
WORKDIR /app/apps/api
EXPOSE 3333
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
