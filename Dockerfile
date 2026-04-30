FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2. nginx для отдачи статики
FROM nginx:alpine

# удаляем дефолтный конфиг
RUN rm -rf /usr/share/nginx/html/*

# копируем билд
COPY --from=builder /app/dist /usr/share/nginx/html

# копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]