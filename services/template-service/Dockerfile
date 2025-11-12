# =========================
# Build stage
# =========================
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.20.0

WORKDIR /app

# Copy root pnpm files (lockfile + workspace)
COPY ../../pnpm-workspace.yaml ../../pnpm-lock.yaml ../../package.json ./

# Copy service package.json
COPY package.json ./ 

# Install only this service's dependencies (with dev)
RUN pnpm install --frozen-lockfile --filter ./

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# =========================
# Production stage
# =========================
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@10.20.0

WORKDIR /app

# Copy root pnpm files
COPY ../../pnpm-workspace.yaml ../../pnpm-lock.yaml ../../package.json ./

# Copy service package.json
COPY package.json ./

# Install only production dependencies for this service
RUN pnpm install --prod --frozen-lockfile --filter ./

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/server.js"]
