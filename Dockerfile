FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:22-alpine AS production

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY --from=builder /app/config/ /app/config/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
