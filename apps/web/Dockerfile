# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Install workspace dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web ./apps/web

# NEXT_PUBLIC_ vars must be baked in at build time (they are inlined into client bundles)
# Pass these as build args in EasyPanel → Build Args section
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN cd apps/web && pnpm build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy package.json and install production deps (plain npm, no workspace needed)
COPY --from=builder /app/apps/web/package.json ./package.json
RUN npm install --omit=dev --ignore-scripts

# Copy Next.js build artifacts and public assets
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["./node_modules/.bin/next", "start"]
