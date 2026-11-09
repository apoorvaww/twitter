FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM dependencies AS runtime

ENV NODE_ENV=production
RUN npm prune --omit=dev

COPY src ./src

EXPOSE 4000
CMD ["node", "src/index.js"]

FROM dependencies AS migrate

COPY drizzle ./drizzle
COPY src/db/schema.js ./src/db/schema.js
COPY drizzle.config.js ./
CMD ["npm", "run", "db:migrate"]