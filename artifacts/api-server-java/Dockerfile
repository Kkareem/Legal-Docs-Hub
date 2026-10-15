# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21 AS build
ARG APP_PROFILE=stg
WORKDIR /build
COPY pom.xml ./
COPY legaldesk-common/pom.xml legaldesk-common/pom.xml
COPY legaldesk-app/pom.xml legaldesk-app/pom.xml
COPY legaldesk-common/src legaldesk-common/src
COPY legaldesk-app/src legaldesk-app/src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -P${APP_PROFILE} -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S legaldesk && adduser -S legaldesk -G legaldesk && mkdir .data && chown legaldesk:legaldesk .data
COPY --from=build /build/legaldesk-app/target/legaldesk-app-1.0.0-SNAPSHOT.jar app.jar
USER legaldesk
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
