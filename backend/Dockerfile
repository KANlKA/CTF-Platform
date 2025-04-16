FROM node:18-alpine
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Security hardening
RUN chown -R node:node /app \
    && apk add --no-cache dumb-init

USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:5000/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]