# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Установка зависимостей для sharp (важно!)
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema BEFORE npm install (чтобы postinstall мог найти schema)
COPY prisma ./prisma

# Install only production dependencies (postinstall запустит prisma generate)
RUN npm install --only=production --ignore-scripts=false

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads/avatars

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]