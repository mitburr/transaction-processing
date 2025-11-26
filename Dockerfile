FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for ts-node)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Use existing node user (already exists with uid/gid 1000)
RUN chown -R node:node /app

USER node

# Expose port
EXPOSE 3000

# Run the categorizer UI with ts-node
CMD ["npx", "ts-node", "src/web/categorizer-ui.ts"]
