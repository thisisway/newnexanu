# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Install dependencies (workspace-aware)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY apps/api ./apps/api
RUN cd apps/api && npx prisma generate && npx nest build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install production deps standalone (without workspace)
COPY apps/api/package.json ./package.json
RUN npm install --omit=dev --ignore-scripts && npm install prisma

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

# Override with the compiled Prisma client from builder
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

# Push schema and start server
CMD ["sh", "-c", "node_modules/.bin/prisma db push && node dist/main"]
