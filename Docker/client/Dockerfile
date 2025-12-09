FROM node:22.21-bullseye-slim

WORKDIR /app/client

RUN npm install -g ts-node

# Copy package manifests first (cache layer) and application source (TypeScript + tsconfig.json etc.)
COPY client/package*.json ./
COPY client/src ./src
COPY client/tsconfig.json .
COPY client/tsconfig.app.json .
COPY client/vite.config.ts .
COPY client/tsconfig.node.json .
COPY client/index.html .
COPY client/eslint.config.js .
COPY client/public ./public

RUN npm i

# Expose client port
ENV PORT=5173
EXPOSE 5173

# Set NODE_ENV for runtime (optional)
ENV NODE_ENV=production

# Run the command you requested
CMD ["npm", "run", "dev"]