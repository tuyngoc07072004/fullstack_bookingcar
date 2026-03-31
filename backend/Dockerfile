# ============================================
# Stage 1: Build dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY backend/package.json backend/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ============================================
# Stage 2: Production image
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY backend/package.json ./
COPY backend/server.js ./
COPY backend/src ./src

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the backend port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/vehicles || exit 1

# Start the server
CMD ["node", "server.js"]
