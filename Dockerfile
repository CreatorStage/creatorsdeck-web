# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

# Run Stage
FROM node:20-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy build output from build stage with correct ownership
COPY --from=build --chown=node:node /app/dist ./dist

# Use non-root node user
USER node

EXPOSE 3001

# Exec form direct run
CMD ["node", "dist/server.cjs"]
