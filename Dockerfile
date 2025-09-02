# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install root deps
COPY package*.json ./

# Install deps for client and server
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install --prefix client && npm install --prefix server

# Copy code
COPY . .

# Set production NODE_ENV for frontend build
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build client
RUN npm run build --prefix client

# Copy client build into server/public
RUN mkdir -p client/dist && mkdir -p server/public && cp -a client/dist/. server/public/

# Build server
RUN npm run build --prefix server
RUN npm prune --prefix server --production

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

    
# Copy server build + deps
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/public ./public
COPY --from=builder /app/server/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/index.js"]