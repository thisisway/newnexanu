# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Install dependencies (workspace-aware)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Copy source and build main app + seed
COPY apps/api ./apps/api
RUN cd apps/api && npx prisma generate && npx nest build && npx tsc -p tsconfig.seed.json

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# OpenSSL 3 required by Prisma query engine on Alpine
RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

# Install production deps and Prisma CLI
COPY apps/api/package.json ./package.json
RUN npm install --omit=dev && npm install prisma

# Copy schema then generate Prisma client for this platform (linux-musl-openssl-3.0.x)
COPY --from=builder /app/apps/api/prisma ./prisma
RUN node_modules/.bin/prisma generate

# Copy compiled app + seed
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/dist-seed/prisma/seed.js ./dist/prisma/seed.js

EXPOSE 3001

# Push schema and start server
CMD ["sh", "-c", "node_modules/.bin/prisma db push && node dist/main"]
