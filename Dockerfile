FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json eslint.config.js ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/engine/package.json packages/engine/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY apps ./apps
COPY packages ./packages
COPY infra ./infra
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system civi && useradd --system --gid civi civi
COPY --from=builder --chown=civi:civi /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=civi:civi /app/node_modules ./node_modules
COPY --from=builder --chown=civi:civi /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder --chown=civi:civi /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=civi:civi /app/apps/web/dist ./apps/web/dist
COPY --from=builder --chown=civi:civi /app/packages ./packages
USER civi
EXPOSE 4100
HEALTHCHECK --interval=20s --timeout=3s --retries=3 CMD node -e "fetch('http://127.0.0.1:4100/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/server/dist/index.js"]
