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

# Télécharger les dépendances (couche cachée pour optimisation)
RUN ./gradlew dependencies --no-daemon

# Copier le code source
COPY src src

# Construire l'application
RUN ./gradlew bootJar --no-daemon

# Phase de runtime avec une image plus légère
FROM eclipse-temurin:17-jre

WORKDIR /app

# Créer un répertoire pour les logs
RUN mkdir -p /app/logs && \
    chmod -R 777 /app/logs

# Copier le JAR depuis l'étape de build
COPY --from=build /app/build/libs/BackGp-0.0.1-SNAPSHOT.jar app.jar

# Exposer le port
EXPOSE 8080

# Démarrer l'application
ENTRYPOINT exec java ${JAVA_OPTS:--Xms256m -Xmx512m} -jar app.jar