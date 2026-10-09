# Trooper container image (two stages: build the React client, then run the Node server)

# --- Stage 1: build the client. Vite writes to ../public, which is /public in this stage ---
FROM node:20-alpine AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Stage 2: the server ---
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies first so Docker can cache this layer
COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .
# The built landing page + staff dashboard (replaces anything copied from the host)
COPY --from=client --chown=node:node /public ./public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run as the unprivileged user that comes with the node image
USER node

# Reports healthy only when the app can also reach the database
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

# start:prod sets up the database on first run (and skips it after that), then starts the server
CMD ["npm", "run", "start:prod"]
