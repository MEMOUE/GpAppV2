FROM gradle:8.3-jdk17 as build

WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app
COPY --from=build /app/build/libs/BackGp-0.0.1-SNAPSHOT.jar app.jar

# Créer le répertoire d'uploads
RUN mkdir -p /app/uploads
VOLUME /app/uploads

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]