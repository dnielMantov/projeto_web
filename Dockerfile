# Serviço "frontend" do Railway (Root Directory = raiz do repositório).
# O backend tem o Dockerfile dele em backend/Dockerfile e não é afetado.

# ---------- build da SPA ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite injeta variáveis VITE_* no bundle em tempo de BUILD, não em runtime.
# O Railway expõe as variáveis do serviço como build args, mas só chegam ao
# build se declaradas aqui. Sem isto, o checkout com cartão quebraria com
# "VITE_MP_PUBLIC_KEY não configurada".
ARG VITE_MP_PUBLIC_KEY
ENV VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY

COPY . .
RUN npm run build

# ---------- servidor estático + proxy do /api ----------
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
