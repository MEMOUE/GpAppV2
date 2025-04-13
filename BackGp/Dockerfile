FROM eclipse-temurin:17-jdk as build

WORKDIR /app

# Copier les fichiers de build et wrapper gradle
COPY gradle gradle
COPY gradlew .
COPY gradlew.bat .
COPY build.gradle .
COPY settings.gradle .

# Rendre le script gradlew exécutable
RUN chmod +x ./gradlew

# Télécharger les dépendances
RUN ./gradlew dependencies

# Copier le code source
COPY src src

# Construire l'application
RUN ./gradlew bootJar --no-daemon

# Phase de runtime
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copier le JAR généré
COPY --from=build /app/build/libs/*.jar app.jar

# Exposer le port
EXPOSE 8080

# Variables d'environnement pour la base de données
ENV SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/gpmonde_db
ENV SPRING_DATASOURCE_USERNAME=root
ENV SPRING_DATASOURCE_PASSWORD=password
ENV SPRING_PROFILES_ACTIVE=prod

# Démarrer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]