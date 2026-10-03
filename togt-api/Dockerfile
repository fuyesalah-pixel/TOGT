FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-slim AS builder
WORKDIR /app
ARG CACHE_BUST=unknown
RUN echo "build $CACHE_BUST"
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# postgresql-client-16 (from the PGDG repo) provides pg_dump/psql that matches
# the postgres:16 server. Debian bookworm ships client 15, and a version
# mismatch makes pg_dump abort with "server version mismatch". gzip compresses
# the dumps.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates gzip curl gnupg \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-client-16 \
    && ln -sf /usr/lib/postgresql/16/bin/pg_dump /usr/bin/pg_dump \
    && ln -sf /usr/lib/postgresql/16/bin/psql /usr/bin/psql \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY package.json ./
EXPOSE 3001
# Apply pending Prisma migrations before booting so every deploy ships its
# schema changes (prisma migrate deploy is idempotent and safe on boot).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
