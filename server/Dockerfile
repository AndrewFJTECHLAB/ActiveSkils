# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copy server package files
COPY package*.json ./
RUN npm install

# Copy server code
COPY . .

# Build server
RUN npm run build

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

    
# Copy server build + deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080
CMD ["node", "dist/index.js"]