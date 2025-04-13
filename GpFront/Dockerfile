# Étape 1: Construire l'application Angular
FROM node:20 as build

WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances avec --legacy-peer-deps pour gérer les conflits de version
RUN npm ci --legacy-peer-deps

# Copier le reste du code source
COPY . .

# Construire l'application
RUN npm run build

# Étape 2: Servir l'application avec Nginx
FROM nginx:alpine

# Supprimer les fichiers par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copier les fichiers de build de l'application DEPUIS L'ÉTAPE PRÉCÉDENTE
COPY --from=build /app/dist/gp-front/browser/ /usr/share/nginx/html/

# Configurer Nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
