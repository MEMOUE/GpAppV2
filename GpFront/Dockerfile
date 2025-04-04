# Étape de build
FROM node:18 as build

WORKDIR /app
COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Étape de production avec Nginx
FROM nginx:stable-alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers de build de l'application
COPY --from=build /app/dist/gp-front/browser /usr/share/nginx/html

# Créer le répertoire pour LetsEncrypt
RUN mkdir -p /var/www/certbot

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
