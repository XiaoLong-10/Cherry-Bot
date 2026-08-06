# Production Dockerfile for Cherry Bot Ultimate
FROM node:20-slim

# Install build dependencies for better-sqlite3, canvas, and @napi-rs/canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (needed for native module compilation)
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start Bot & Dashboard Server
CMD ["node", "index.js"]
