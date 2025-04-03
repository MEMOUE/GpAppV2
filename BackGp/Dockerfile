# Étape de construction avec Gradle
FROM gradle:7.6-jdk17 AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier le code source dans le conteneur
COPY . .

# Construire le projet avec Gradle, en excluant les tests
RUN gradle build --no-daemon -x test

# Étape de production
FROM openjdk:17-jdk-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier JAR spécifique du build dans l'image de production
COPY --from=build /app/build/libs/BackGp-0.0.1-SNAPSHOT.jar app.jar

# Exposer le port sur lequel l'application écoute
EXPOSE 8080

# Commande d'exécution de l'application
ENTRYPOINT ["java", "-jar", "app.jar"]