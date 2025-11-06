FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY app.js main.js data.json ./
COPY controllers ./controllers
COPY lib ./lib
COPY middleware ./middleware
COPY routes ./routes

# The official image ships an unprivileged "node" user; the app files
# stay root-owned, so the process can read but not modify them.
USER node
EXPOSE 3000
CMD ["node", "main.js"]
