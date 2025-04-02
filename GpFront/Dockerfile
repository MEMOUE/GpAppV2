# Étape de build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build --configuration=production

# Étape de production
FROM nginx:alpine

# Suppression des configurations par défaut
RUN rm -rf /etc/nginx/conf.d/*

# Copie des fichiers de build
COPY --from=builder /app/dist/gp-front /usr/share/nginx/html

# Copie de la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
