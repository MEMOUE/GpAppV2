# Utiliser une image de base avec Java 17 et Maven
FROM maven:3.8.6-openjdk-17 as build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Utiliser une image de base avec Java 17 pour exécuter l'application
FROM openjdk:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/BackGp.jar ./app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]