# Étape 1: Construire l'application Angular
FROM node:20 as build

WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances avec --legacy-peer-deps pour gérer les conflits de version
RUN npm ci --legacy-peer-deps

# Copier le reste du code source
COPY . .

# Construire l'application (si ce n'est pas déjà fait)
RUN npm run build

# Étape 2: Servir l'application avec Nginx
FROM nginx:alpine

# Copier les fichiers de build de l'application
COPY --from=build /app/dist/gp-front/browser /usr/share/nginx/html

# Configurer Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
