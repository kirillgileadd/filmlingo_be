# Stage 1: Build application
FROM node:22 AS builder
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходный код и билдим проект
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22
WORKDIR /app

# Копируем собранное приложение из Stage 1
COPY --from=builder /app ./

# Указываем переменные окружения и стартуем сервер Nest.js
ENV PORT=8000
EXPOSE 8000
CMD ["npm", "run", "start:prod"]
