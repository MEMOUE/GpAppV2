# Étape de build Angular
FROM node:18-alpine as build

WORKDIR /app

COPY ./ ./

# Corriger la commande d’installation des dépendances
RUN npm install --legacy-peer-deps && npm run build --prod

# Étape de production - Nginx ne sera pas utilisé ici car il est sur l'hôte
FROM alpine

WORKDIR /app

# Juste copier les fichiers générés
COPY --from=build /app/dist/gp-front/browser /app/dist
