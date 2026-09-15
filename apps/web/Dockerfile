FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm install --workspace=packages/shared --workspace=apps/web
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/web

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
