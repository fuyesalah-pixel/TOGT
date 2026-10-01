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
# postgresql-client provides pg_dump/psql for the backup/restore engine;
# gzip compresses the dumps.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client gzip && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY package.json ./
EXPOSE 3001
# Apply pending Prisma migrations before booting so every deploy ships its
# schema changes (prisma migrate deploy is idempotent and safe on boot).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
