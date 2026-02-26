# Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .

RUN dotnet restore PulseCRM.Api/PulseCRM.Api.csproj
RUN dotnet publish PulseCRM.Api/PulseCRM.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}
EXPOSE 8080
ENTRYPOINT ["dotnet", "PulseCRM.Api.dll"]