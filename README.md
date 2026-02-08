# Qaflaty - Multi-Tenant E-Commerce SaaS Platform

Qaflaty is a multi-tenant e-commerce SaaS platform built with Domain-Driven Design (DDD) principles, allowing merchants to create and manage their own online stores with custom subdomain or domain support.

## Architecture

This project follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles with three bounded contexts:

- **Identity Context**: Authentication, authorization, and merchant management
- **Catalog Context**: Product management, categories, and inventory
- **Ordering Context**: Shopping cart, orders, and order processing

### Tech Stack

**Backend:**
- .NET 10 Web API
- Entity Framework Core 10 with PostgreSQL
- MediatR for CQRS pattern
- FluentValidation for domain validation
- Serilog for structured logging
- JWT Bearer authentication

**Frontend:**
- Angular 19
- Separate apps for landing, merchant dashboard, and customer stores

**Database:**
- PostgreSQL 17

## Project Structure

```
Qaflaty/
├── src/
│   ├── Qaflaty.Domain/          # Domain layer (entities, value objects, aggregates)
│   ├── Qaflaty.Application/     # Application layer (use cases, CQRS handlers)
│   ├── Qaflaty.Infrastructure/  # Infrastructure layer (EF Core, repositories)
│   └── Qaflaty.Api/            # API layer (controllers, middleware)
└── README.md
```

## Prerequisites

- .NET 10 SDK
- PostgreSQL 17
- Node.js 20+ (for Angular frontend)
- Docker Desktop (optional, for containerized development)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Qafilaty
```

### 2. Configure Database

Update the connection string in `src/Qaflaty.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=qaflaty_db;Username=qaflaty;Password=your_password"
  }
}
```

### 3. Configure JWT Settings

Update the JWT settings in `src/Qaflaty.Api/appsettings.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-minimum-32-characters-long",
    "Issuer": "Qaflaty",
    "Audience": "QaflatyApp",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  }
}
```

### 4. Run Database Migrations

```bash
cd src/Qaflaty.Api
dotnet ef database update
```

### 5. Run the Application

```bash
cd src/Qaflaty.Api
dotnet run
```

The API will be available at `https://localhost:5001` (or as configured).

### 6. Access Swagger UI

Navigate to `https://localhost:5001/swagger` to explore the API endpoints.

## Multi-Tenancy

Qaflaty uses subdomain-based multi-tenancy:

- **Main Site**: `qaflaty.com` - Landing page
- **Merchant Dashboard**: `merchant.qaflaty.com` - Merchant management portal
- **Store Frontend**: `{storename}.qaflaty.com` - Customer-facing store

Merchants can later configure custom domains to replace the subdomain.

## Development

### Domain Layer

The Domain layer contains:
- **Entities**: Core business objects with identity
- **Value Objects**: Immutable objects with no identity (Email, Money, PhoneNumber)
- **Aggregates**: Clusters of entities and value objects with transactional boundaries
- **Domain Events**: Events that capture business-relevant occurrences
- **Strongly Typed IDs**: Type-safe identifiers (MerchantId, StoreId, ProductId, etc.)

### Application Layer

The Application layer implements:
- **CQRS**: Commands and Queries using MediatR
- **Use Cases**: Business workflows and orchestration
- **Validation**: FluentValidation rules
- **DTOs**: Data transfer objects

### Infrastructure Layer

The Infrastructure layer provides:
- **EF Core DbContext**: Database access
- **Repositories**: Data persistence implementations
- **Unit of Work**: Transaction management
- **External Services**: Third-party integrations

### API Layer

The API layer exposes:
- **Controllers**: RESTful endpoints
- **Middleware**: Authentication, logging, error handling
- **Filters**: Cross-cutting concerns

## Testing

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true
```

## Docker Support

Docker Compose configuration will be added for local development with PostgreSQL.

## Contributing

1. Follow DDD principles and Clean Architecture
2. Write unit tests for domain logic
3. Use Result pattern for error handling (no exceptions for business logic)
4. Follow the existing code style and conventions

## License

[License information to be added]

## MVP Phase

This is currently in the MVP phase with:
- Faked payment integration (to be integrated later)
- Core e-commerce functionality
- Multi-tenant architecture
- Subdomain routing

For detailed task breakdown, see `TASKS.md`.
