# Runtime image that runs TypeScript sources via ts-node
FROM node:22.21-bullseye-slim

WORKDIR /app/server
RUN npm install -g ts-node
# Copy package manifests first (cache layer) and application source (TypeScript + tsconfig.json etc.)
COPY server/package*.json ./
COPY server/src ./src
COPY server/jest.config.ts .
COPY server/tsconfig.json .
COPY server/nodemon.json .
COPY server/data ./data
COPY server/docs ./docs
COPY server/logs ./logs
COPY server/scripts/populate-db.ts ./scripts/populate-db.ts

RUN npm i

# Expose server port
ENV PORT=3000
EXPOSE 3000

# Set NODE_ENV for runtime (optional)
ENV NODE_ENV=production

# Run the command you requested
CMD ["npm", "run", "start:prod"]