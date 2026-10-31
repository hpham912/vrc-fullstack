# Build stage: Compile Java 21 Spring Boot using Maven
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
# Cache Maven dependencies
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Production Run stage: Lightweight Alpine JRE 21 image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

# Cloud Run injects the PORT environment variable (typically 8080)
ENV PORT=8080
EXPOSE 8080

# Optimize JVM for Cloud Run container memory limits & quick cold-starts
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar --server.port=${PORT}"]
