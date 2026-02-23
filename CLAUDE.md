# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (.NET 10)

```bash
# Run the API (from repo root or src/Qaflaty.Api)
dotnet run --project src/Qaflaty.Api

# Apply database migrations
dotnet ef database update --project src/Qaflaty.Infrastructure --startup-project src/Qaflaty.Api

# Add a new migration
dotnet ef migrations add <MigrationName> --project src/Qaflaty.Infrastructure --startup-project src/Qaflaty.Api

# Run all tests
dotnet test

# Run a single test project
dotnet test tests/<TestProject>

# Build the solution
dotnet build
```

### Frontend (Angular 20, Angular CLI)

All frontend commands run from `clients/qaflaty-workspace/`:

```bash
npm install

# Serve the merchant dashboard (port 4202)
npm run start:merchant

# Serve the customer store app (port 4201)
npm run start:store

# Run Angular tests (Karma/Jasmine)
npm test
```

### Docker (PostgreSQL only)

```bash
# Start PostgreSQL + pgAdmin
docker-compose up -d

# pgAdmin at http://localhost:5050
```

The backend API runs locally (not in Docker). Dev DB connection: `Host=localhost;Port=5432;Database=qaflaty_db;Username=postgres;Password=P@ssw0rd`.

## Architecture

### Bounded Contexts

The domain is split into four bounded contexts, each with its own folder in all layers:

| Context | Responsibility |
|---------|---------------|
| **Identity** | Merchant auth, JWT tokens |
| **Catalog** | Stores, products, categories, store configuration, FAQ, page config |
| **Ordering** | Customers, carts (guest + authenticated), wishlists, orders, payments |
| **Communication** | Live chat (`ChatConversation` aggregate, SignalR hub at `/hubs/chat`) |
| **Storefront** | Cross-cutting storefront queries and repositories |

### Layer Structure

```
src/
├── Qaflaty.Domain/          # Entities, aggregates, value objects, domain events, repository interfaces
├── Qaflaty.Application/     # CQRS handlers, DTOs, FluentValidation validators, domain event handlers
├── Qaflaty.Infrastructure/  # EF Core, repository implementations, services
└── Qaflaty.Api/             # Controllers, middleware, SignalR hub
```

### Key Patterns

**Result pattern** — all application handlers return `Result` or `Result<T>` (never throw for business errors). `ApiController.HandleResult()` maps errors to HTTP status codes using the `Error.Code` string (e.g., codes containing "NotFound" → 404, "Conflict"/"AlreadyExists" → 409).

**CQRS via MediatR** — commands implement `ICommand` / `ICommand<TResponse>`, queries implement `IQuery<TResponse>`. Pipeline behaviors: `LoggingBehavior` → `ValidationBehavior` → `UnitOfWorkBehavior` (commits after successful commands).

**Strongly typed IDs** — every aggregate uses a dedicated record ID (e.g., `MerchantId`, `StoreId`, `ProductId`) defined in `Qaflaty.Domain/Common/Identifiers/`.

**Domain events** — dispatched automatically by `DomainEventDispatcherInterceptor` on `SaveChanges`. Aggregates inherit `AggregateRoot` which holds a list of `DomainEvent`.

**EF Core interceptors** — `AuditableEntityInterceptor` sets `CreatedAt`/`UpdatedAt`; `DomainEventDispatcherInterceptor` dispatches domain events post-save.

**Multi-tenancy** — `TenantMiddleware` resolves the current store for all `/api/storefront/*` routes using `X-Store-Slug` or `X-Custom-Domain` request headers and sets it on `ITenantContext`.

**Cart duality** — guest carts use a `GuestSessionId` (Guid), authenticated carts use `CustomerId`. A `GuestCartCleanupService` background service purges expired guest carts.

### Frontend Apps

Located in `clients/qaflaty-workspace/projects/`:

- **merchant** — dashboard at port 4202; core services (`auth.service`, `store-context.service`), interceptors (`auth.interceptor`, `error.interceptor`), feature modules: `auth`, `stores`, `products`, `customers`, `orders`, `chat`, `store-builder`, `settings`, `dashboard`, `active-carts`
- **store** — customer-facing storefront at port 4201; interceptors: `store-header.interceptor` (injects `X-Store-Slug`), `guest-cart.interceptor`, `customer-auth.interceptor`
- **shared** — shared Angular library consumed by merchant and store apps
- **landing** — marketing landing page

Dev proxy forwards `/api` → `http://localhost:5000` (configured in `proxy.conf.json`).

### Infrastructure Services

| Service | Implementation |
|---------|---------------|
| `ITokenService` | `JwtTokenService` |
| `IPasswordHasher` | `PasswordHasher` (bcrypt) |
| `ICurrentUserService` | `CurrentUserService` (reads JWT claims) |
| `IPaymentProcessor` | `MockPaymentProcessor` (MVP stub) |
| `IFileStorageService` | `LocalFileStorageService` (files under `wwwroot`) |
| `IOrderNumberGenerator` | `OrderNumberGenerator` |
| `ITenantContext` / `IDateTimeProvider` | Scoped / Singleton infra services |

### Adding a New Feature (Typical Flow)

1. **Domain** — add entity/value object under the appropriate bounded context in `Qaflaty.Domain/<Context>/`; add a repository interface in `<Context>/Repositories/`
2. **Infrastructure** — implement repository in `Qaflaty.Infrastructure/Persistence/Repositories/`; add EF configuration in `Persistence/Configurations/<Context>/`; register in `DependencyInjection.cs`; create migration
3. **Application** — add command/query record + handler in `Qaflaty.Application/<Context>/Commands/` or `Queries/`; add FluentValidation validator alongside the command
4. **API** — add or extend a controller inheriting `ApiController`; call `await Sender.Send(command)` and return `HandleResult(...)`
