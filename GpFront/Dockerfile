# Étape 1: Utiliser une image de base Node.js pour construire l'application Angular
FROM node:18 as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Étape 2: Utiliser une image Nginx pour servir l'application Angular
FROM nginx:alpine
COPY --from=build /app/dist/GpFront /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
