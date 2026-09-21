FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install fontconfig and freetype for JasperReports
RUN apt-get update && \
    apt-get install -y fontconfig libfreetype6 fonts-dejavu fonts-dejavu-core && \
    fc-cache -f -v && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx256m -Djava.awt.headless=true -Djava.io.tmpdir=/tmp"
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
