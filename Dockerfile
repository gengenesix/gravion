# Multi-stage build for GRAVION

# Stage 1: Build everything (using monorepo structure)
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for native modules (like DuckDB)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy root package files and workspace configs
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (use install not ci so new packages like cesium are picked up)
RUN npm ci

# Copy source code for both client and server
COPY client/ ./client/
COPY server/ ./server/

# Download Cesium into public dir so it's served locally (no CDN needed, works offline)
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends wget ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    CESIUM_VER=1.125.0 && \
    BASE="https://cdn.jsdelivr.net/npm/cesium@${CESIUM_VER}/Build/Cesium" && \
    mkdir -p /app/client/public/cesium && \
    wget -q "${BASE}/Cesium.js" -O /app/client/public/cesium/Cesium.js && \
    wget -q "${BASE}/Widgets/widgets.css" -O /app/client/public/cesium/widgets.css && \
    echo "Cesium ${CESIUM_VER} bundled OK — $(wc -c < /app/client/public/cesium/Cesium.js) bytes"

# Build client
RUN npm run build:client

# Build server
RUN npm run build:server

# Stage 2: Production image
FROM node:20-slim

WORKDIR /app

# Copy package files for structure
COPY package*.json ./
COPY server/package*.json ./server/

# Copy node_modules from builder (includes compiled DuckDB)
# This avoids rebuilding native modules in production
COPY --from=builder /app/node_modules ./node_modules

# Copy built server from builder
COPY --from=builder /app/server/dist ./dist

# Copy built client from builder (to be served by Express)
COPY --from=builder /app/client/dist ./public

# Copy locally-bundled Cesium into public (served at /cesium/*)
COPY --from=builder /app/client/public/cesium ./public/cesium

# Copy server source files that might be needed at runtime
COPY --from=builder /app/server/src/news_feeds.json ./

# Copy static data files
COPY --from=builder /app/server/src/Data/military-bases.kml ./Data/military-bases.kml
RUN mkdir -p ./Data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set NODE_ENV
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"]
