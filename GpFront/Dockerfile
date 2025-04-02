# Build stage
FROM node:18 AS build
WORKDIR /app

# Copie des fichiers package.json et package-lock.json pour installer les dépendances en premier
COPY package*.json ./

# Installation des dépendances
RUN npm ci --legacy-peer-deps

# Copie du reste du projet
COPY . .

# Compilation du projet en mode production
RUN npm run build --configuration=production

# Production stage
FROM nginx:alpine

# Suppression de la configuration par défaut
RUN rm -rf /etc/nginx/conf.d/*

# Copie des fichiers de build et de configuration
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposition du port 80
EXPOSE 80

# Démarrage de Nginx
CMD ["nginx", "-g", "daemon off;"]
