# Multi-stage build for INTELMAP

# Stage 1: Build client
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci

# Copy client source
COPY client/ ./

# Build client
RUN npm run build

# Stage 2: Build server
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci

# Copy server source
COPY server/ ./

# Build server
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./
RUN npm ci --only=production

# Copy built server from builder
COPY --from=server-builder /app/server/dist ./dist

# Copy built client from builder (to be served by Express)
COPY --from=client-builder /app/client/dist ./public

# Copy aircraft database (if needed)
# COPY server/src/Data/*.parquet ./Data/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["node", "dist/index.js"]
