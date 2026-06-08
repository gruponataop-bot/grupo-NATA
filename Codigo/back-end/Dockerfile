# Estágio 1: Build da aplicação usando Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
# Copia os arquivos do projeto para dentro do container
COPY . .
# Executa o comando para compilar e gerar o arquivo .jar (ignorando os testes)
RUN mvn clean package -DskipTests

# Estágio 2: Execução da aplicação com uma imagem leve do Java
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copia o .jar gerado no estágio anterior para este novo estágio
COPY --from=build /app/target/*.jar app.jar
# Expoe a porta padrão do Spring Boot
EXPOSE 8080
# Comando para rodar a aplicação
ENTRYPOINT ["java","-jar","app.jar"]