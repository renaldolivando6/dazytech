# Production image: Next.js standalone (Node server di port 3000).
# Dulu static export + nginx; sejak ada /admin + SQLite butuh server Node.

# Stage 1: dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
# better-sqlite3 membawa binary prebuilt untuk musl/Node 24, jadi tidak perlu
# python/g++ di sini.
RUN npm ci

# Stage 2: build
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: runtime minimal — hanya output standalone, tanpa source & devDeps.
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/app/data/dazytech.db

# Jalan sebagai user non-root. Container dazytech pernah disusupi crypto miner;
# proses tanpa root membatasi apa yang bisa dilakukan kalau itu terulang.
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# File migrasi SQL, dijalankan otomatis saat server start (src/instrumentation.ts).
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

# Folder database. Di production di-mount named volume (lihat docker-compose.yml);
# volume baru mewarisi kepemilikan folder ini, jadi user nextjs bisa menulis.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health/ >/dev/null || exit 1

CMD ["node", "server.js"]
