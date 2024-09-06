# build image
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY ./prisma /prisma

COPY . .

# production image
# FROM node:18-alpine
# WORKDIR /app
# ENV NODE_ENV production

# RUN npm ci --only=production --quiet

# COPY --chown=node:node --from=builder /app/prisma /app/prisma

# USER node

EXPOSE 3000

CMD ["node", "server.js"]