FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create upload directories
RUN mkdir -p uploads/avatars uploads/challenges

EXPOSE 5001

CMD ["node", "server.js"]
