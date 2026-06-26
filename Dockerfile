FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY src/Qaflaty.Domain/Qaflaty.Domain.csproj src/Qaflaty.Domain/
COPY src/Qaflaty.Application/Qaflaty.Application.csproj src/Qaflaty.Application/
COPY src/Qaflaty.Infrastructure/Qaflaty.Infrastructure.csproj src/Qaflaty.Infrastructure/
COPY src/Qaflaty.Api/Qaflaty.Api.csproj src/Qaflaty.Api/

RUN dotnet restore src/Qaflaty.Api/Qaflaty.Api.csproj

COPY src/ src/

RUN dotnet publish src/Qaflaty.Api/Qaflaty.Api.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN mkdir -p wwwroot/uploads logs

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "Qaflaty.Api.dll"]
