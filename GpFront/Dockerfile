# Étape de build
FROM node:18-alpine AS builder
WORKDIR /app

# Copie et installation des dépendances
COPY package*.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copie du projet et build
COPY . .
RUN npm run build --configuration=production

# Étape de production avec Nginx
FROM nginx:alpine

# Suppression des configurations par défaut
RUN rm -rf /etc/nginx/conf.d/*

# Ajout d'un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copie des fichiers de build
COPY --from=builder /app/dist/gp-front/browser /usr/share/nginx/html

# Copie de la configuration Nginx
COPY --chown=appuser:appgroup nginx.conf /etc/nginx/nginx.conf

# Exposition du port 80
EXPOSE 80

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]
