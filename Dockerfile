# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite environment variables
ARG AI_API_KEY
ARG AI_MODEL=gemini-3.1-flash-lite-preview

# Set as env vars so Vite's loadEnv can pick them up during build
ENV AI_API_KEY=${AI_API_KEY}
ENV AI_MODEL=${AI_MODEL}

# Write .env file for Vite's loadEnv()
RUN echo "AI_API_KEY=${AI_API_KEY}" > .env && \
    echo "AI_MODEL=${AI_MODEL}" >> .env

# Build the project
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
