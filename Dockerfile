# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy Prisma schema BEFORE npm install (чтобы postinstall мог найти schema)
COPY prisma ./prisma

# Install dependencies (postinstall запустит prisma generate)
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema BEFORE npm install (чтобы postinstall мог найти schema)
COPY prisma ./prisma

# Install only production dependencies (postinstall запустит prisma generate)
RUN npm install --only=production --ignore-scripts=false

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy source files for Swagger JSDoc (нужны для генерации документации)
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

