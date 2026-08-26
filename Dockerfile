# Multi-stage Dockerfile for DDC Compiler Platform
# Includes Node.js runtime + GCC, G++, Python3, and OpenJDK for real code execution

FROM node:20-bookworm-slim AS base

# Install C/C++ compiler, Python 3, OpenJDK for the isolated code runner
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3 \
    default-jdk \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend & compile TypeScript backend
RUN npm run build

# Expose default application port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start production server
CMD ["node", "dist/server.cjs"]
