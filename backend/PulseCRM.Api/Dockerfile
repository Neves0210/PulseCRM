# Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .
RUN dotnet restore backend/PulseCRM.Api/PulseCRM.Api.csproj
RUN dotnet publish PulseCRM.Api/PulseCRM.Api.csproj -c Release -o /app/publish

# Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render define a porta via $PORT. Vamos escutar nela.
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

EXPOSE 10000
ENTRYPOINT ["dotnet", "PulseCRM.Api.dll"]