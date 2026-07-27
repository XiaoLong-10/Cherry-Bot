# Production Dockerfile for Cherry Bot Ultimate
FROM node:20-alpine AS base

# Install build dependencies for better-sqlite3 and canvas native modules
RUN apk add --no-join-no-cache --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start Bot & Dashboard Server
CMD ["node", "index.js"]
