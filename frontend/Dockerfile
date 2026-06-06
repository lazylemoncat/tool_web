FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG API_PROXY_TARGET=http://backend:8000
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ARG API_PROXY_TARGET=http://backend:8000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_PROXY_TARGET=${API_PROXY_TARGET}

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
