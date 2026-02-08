# Qaflaty MVP - Task List (DDD Architecture)

> **Project**: Qaflaty - Multi-tenant E-commerce SaaS Platform
> **Architecture**: Domain-Driven Design (DDD) with Clean Architecture
> **Stack**: .NET 10 Web API, Angular 19, PostgreSQL
> **Status**: MVP Phase

---

## Architecture Reference

See `ARCHITECTURE-DDD.md` for detailed diagrams and patterns including:
- Bounded Contexts (Identity, Catalog, Ordering)
- Aggregates, Entities, Value Objects
- Domain Events and CQRS Pattern
- Layer Dependencies

---

## Project Overview

Qaflaty is a multi-tenant e-commerce platform where merchants can create their own online stores. Each store is accessible via a unique subdomain (e.g., `storename.qaflaty.com`) or a custom domain.

**Bounded Contexts**:
1. **Identity Context** - Merchants, Authentication, Authorization
2. **Catalog Context** - Stores, Products, Categories
3. **Ordering Context** - Orders, Customers, Payments

**Key DDD Patterns Used**:
- Aggregates with invariants
- Value Objects for type safety
- Domain Events for cross-context communication
- CQRS (Commands and Queries separated)
- Repository pattern with Unit of Work
- Strongly Typed IDs

---

## Task Status Legend

- [ ] **Pending** - Not started
- [x] **Completed** - Done
- [🔄] **In Progress** - Currently being worked on

---

## Phase 1: Solution Setup & Domain Foundation

### Task 1.1: Initialize .NET Solution with DDD Structure

**Agent**: `backend-developer`

**Description**:
Create the initial .NET 10 solution following Clean Architecture and DDD project structure.

**Detailed Requirements**:

1. Create solution file `Qaflaty.sln` in root directory

2. Create the following projects with proper layer separation:

   **Domain Layer** - `src/Qaflaty.Domain/`
   - No external dependencies (pure C#)
   - Contains all domain logic

   **Application Layer** - `src/Qaflaty.Application/`
   - Depends only on Domain
   - Contains use cases (Commands/Queries)

   **Infrastructure Layer** - `src/Qaflaty.Infrastructure/`
   - Implements interfaces from Domain/Application
   - Contains EF Core, external services

   **Presentation Layer** - `src/Qaflaty.Api/`
   - ASP.NET Core Web API
   - Depends on all layers for DI setup

3. Project structure for `Qaflaty.Domain`:
   ```
   Qaflaty.Domain/
   ├── Common/
   │   ├── Primitives/
   │   │   ├── Entity.cs
   │   │   ├── AggregateRoot.cs
   │   │   ├── ValueObject.cs
   │   │   ├── DomainEvent.cs
   │   │   └── IDomainEventHandler.cs
   │   ├── Identifiers/
   │   │   ├── MerchantId.cs
   │   │   ├── StoreId.cs
   │   │   ├── ProductId.cs
   │   │   ├── CategoryId.cs
   │   │   ├── CustomerId.cs
   │   │   ├── OrderId.cs
   │   │   └── OrderItemId.cs
   │   ├── ValueObjects/
   │   │   ├── Money.cs
   │   │   ├── Email.cs
   │   │   └── PhoneNumber.cs
   │   └── Errors/
   │       ├── Error.cs
   │       ├── Result.cs
   │       └── ResultT.cs
   ├── Identity/
   ├── Catalog/
   └── Ordering/
   ```

4. Create base primitives:

   **Entity.cs**:
   ```csharp
   public abstract class Entity<TId> : IEquatable<Entity<TId>>
       where TId : notnull
   {
       public TId Id { get; protected init; }
       protected Entity(TId id) => Id = id;

       // Equality based on Id
       // GetHashCode implementation
   }
   ```

   **AggregateRoot.cs**:
   ```csharp
   public abstract class AggregateRoot<TId> : Entity<TId>
       where TId : notnull
   {
       private readonly List<IDomainEvent> _domainEvents = [];
       public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

       protected void RaiseDomainEvent(IDomainEvent domainEvent)
           => _domainEvents.Add(domainEvent);

       public void ClearDomainEvents() => _domainEvents.Clear();
   }
   ```

   **ValueObject.cs**:
   ```csharp
   public abstract class ValueObject : IEquatable<ValueObject>
   {
       protected abstract IEnumerable<object> GetEqualityComponents();
       // Equality implementation using components
   }
   ```

   **DomainEvent.cs**:
   ```csharp
   public interface IDomainEvent
   {
       Guid EventId { get; }
       DateTime OccurredAt { get; }
   }

   public abstract record DomainEvent : IDomainEvent
   {
       public Guid EventId { get; } = Guid.NewGuid();
       public DateTime OccurredAt { get; } = DateTime.UtcNow;
   }
   ```

5. Create strongly typed IDs (all follow same pattern):
   ```csharp
   public readonly record struct MerchantId(Guid Value)
   {
       public static MerchantId New() => new(Guid.NewGuid());
       public static MerchantId Empty => new(Guid.Empty);
       public override string ToString() => Value.ToString();
   }
   ```

6. Create Result pattern for error handling:
   ```csharp
   public class Result
   {
       public bool IsSuccess { get; }
       public bool IsFailure => !IsSuccess;
       public Error Error { get; }

       public static Result Success() => new(true, Error.None);
       public static Result Failure(Error error) => new(false, error);
   }

   public class Result<T> : Result
   {
       public T Value { get; }
       public static Result<T> Success(T value) => new(value);
       public static Result<T> Failure(Error error) => new(error);
   }

   public record Error(string Code, string Message)
   {
       public static readonly Error None = new(string.Empty, string.Empty);
   }
   ```

7. Create common Value Objects:

   **Money.cs**:
   - Amount (decimal), Currency (enum: SAR, USD)
   - Validation: Amount >= 0
   - Methods: Add, Subtract, Multiply
   - Static: Zero(Currency)

   **Email.cs**:
   - Value (string)
   - Validation: Valid email format
   - Static: Create(string) returns Result<Email>

   **PhoneNumber.cs**:
   - Value (string)
   - Validation: Valid phone format
   - Static: Create(string) returns Result<PhoneNumber>

8. Add NuGet packages:
   - **Domain**: None (pure C#)
   - **Application**: MediatR, FluentValidation
   - **Infrastructure**: Npgsql.EntityFrameworkCore.PostgreSQL, BCrypt.Net-Next
   - **Api**: Swashbuckle, Serilog

9. Configure `Program.cs` with basic setup:
   - Dependency injection registration
   - CORS for Angular apps
   - Swagger documentation
   - JSON serialization (camelCase)

10. Create `appsettings.json` with placeholders

11. Create `.gitignore` for .NET projects

**Expected Output**:
- Complete DDD solution structure
- Base primitives ready for use
- Strongly typed IDs for all aggregates
- Result pattern for error handling
- Solution compiles without errors

**Status**: [ ] Pending

---

### Task 1.2: Create Identity Bounded Context - Domain Layer

**Agent**: `backend-developer`

**Description**:
Implement the Identity bounded context domain layer including Merchant aggregate, value objects, and domain events.

**Detailed Requirements**:

1. Create directory structure:
   ```
   Qaflaty.Domain/Identity/
   ├── Aggregates/
   │   └── Merchant/
   │       ├── Merchant.cs
   │       ├── RefreshToken.cs
   │       └── Events/
   │           ├── MerchantRegisteredEvent.cs
   │           └── PasswordChangedEvent.cs
   ├── ValueObjects/
   │   ├── HashedPassword.cs
   │   └── PersonName.cs
   ├── Services/
   │   └── IPasswordHasher.cs
   ├── Repositories/
   │   └── IMerchantRepository.cs
   └── Errors/
       └── IdentityErrors.cs
   ```

2. **Merchant Aggregate Root** (`Merchant.cs`):
   ```csharp
   public sealed class Merchant : AggregateRoot<MerchantId>
   {
       // Properties
       public Email Email { get; private set; }
       public HashedPassword PasswordHash { get; private set; }
       public PersonName FullName { get; private set; }
       public PhoneNumber? Phone { get; private set; }
       public bool IsVerified { get; private set; }
       public DateTime CreatedAt { get; private set; }
       public DateTime UpdatedAt { get; private set; }

       // Navigation
       private readonly List<RefreshToken> _refreshTokens = [];
       public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens.AsReadOnly();

       // Private constructor for EF Core
       private Merchant() { }

       // Factory method
       public static Result<Merchant> Create(
           Email email,
           HashedPassword passwordHash,
           PersonName fullName,
           PhoneNumber? phone = null)
       {
           var merchant = new Merchant
           {
               Id = MerchantId.New(),
               Email = email,
               PasswordHash = passwordHash,
               FullName = fullName,
               Phone = phone,
               IsVerified = false,
               CreatedAt = DateTime.UtcNow,
               UpdatedAt = DateTime.UtcNow
           };

           merchant.RaiseDomainEvent(new MerchantRegisteredEvent(merchant.Id, email));

           return Result<Merchant>.Success(merchant);
       }

       // Behaviors
       public Result ChangePassword(HashedPassword newPasswordHash)
       {
           PasswordHash = newPasswordHash;
           UpdatedAt = DateTime.UtcNow;
           RaiseDomainEvent(new PasswordChangedEvent(Id));
           return Result.Success();
       }

       public Result UpdateProfile(PersonName fullName, PhoneNumber? phone)
       {
           FullName = fullName;
           Phone = phone;
           UpdatedAt = DateTime.UtcNow;
           return Result.Success();
       }

       public Result Verify()
       {
           if (IsVerified)
               return Result.Failure(IdentityErrors.AlreadyVerified);

           IsVerified = true;
           UpdatedAt = DateTime.UtcNow;
           return Result.Success();
       }

       public RefreshToken AddRefreshToken(string token, DateTime expiresAt)
       {
           var refreshToken = RefreshToken.Create(Id, token, expiresAt);
           _refreshTokens.Add(refreshToken);
           return refreshToken;
       }

       public void RevokeRefreshToken(string token)
       {
           var refreshToken = _refreshTokens.FirstOrDefault(rt => rt.Token == token);
           refreshToken?.Revoke();
       }

       public void RevokeAllRefreshTokens()
       {
           foreach (var token in _refreshTokens.Where(rt => !rt.IsRevoked))
               token.Revoke();
       }
   }
   ```

3. **RefreshToken Entity** (`RefreshToken.cs`):
   ```csharp
   public sealed class RefreshToken : Entity<Guid>
   {
       public MerchantId MerchantId { get; private set; }
       public string Token { get; private set; }
       public DateTime ExpiresAt { get; private set; }
       public DateTime CreatedAt { get; private set; }
       public DateTime? RevokedAt { get; private set; }

       public bool IsRevoked => RevokedAt.HasValue;
       public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
       public bool IsActive => !IsRevoked && !IsExpired;

       private RefreshToken() { }

       public static RefreshToken Create(MerchantId merchantId, string token, DateTime expiresAt)
       {
           return new RefreshToken
           {
               Id = Guid.NewGuid(),
               MerchantId = merchantId,
               Token = token,
               ExpiresAt = expiresAt,
               CreatedAt = DateTime.UtcNow
           };
       }

       public void Revoke() => RevokedAt = DateTime.UtcNow;
   }
   ```

4. **Value Objects**:

   **HashedPassword.cs**:
   ```csharp
   public sealed class HashedPassword : ValueObject
   {
       public string Value { get; }

       private HashedPassword(string value) => Value = value;

       public static HashedPassword FromHash(string hash) => new(hash);

       protected override IEnumerable<object> GetEqualityComponents()
       {
           yield return Value;
       }
   }
   ```

   **PersonName.cs**:
   ```csharp
   public sealed class PersonName : ValueObject
   {
       public string Value { get; }

       private PersonName(string value) => Value = value;

       public static Result<PersonName> Create(string name)
       {
           if (string.IsNullOrWhiteSpace(name))
               return Result<PersonName>.Failure(IdentityErrors.NameRequired);

           if (name.Length < 2 || name.Length > 100)
               return Result<PersonName>.Failure(IdentityErrors.NameInvalidLength);

           return Result<PersonName>.Success(new PersonName(name.Trim()));
       }

       protected override IEnumerable<object> GetEqualityComponents()
       {
           yield return Value;
       }
   }
   ```

5. **Domain Events**:

   **MerchantRegisteredEvent.cs**:
   ```csharp
   public sealed record MerchantRegisteredEvent(
       MerchantId MerchantId,
       Email Email
   ) : DomainEvent;
   ```

   **PasswordChangedEvent.cs**:
   ```csharp
   public sealed record PasswordChangedEvent(
       MerchantId MerchantId
   ) : DomainEvent;
   ```

6. **Domain Service Interface**:

   **IPasswordHasher.cs**:
   ```csharp
   public interface IPasswordHasher
   {
       HashedPassword Hash(string password);
       bool Verify(string password, HashedPassword hashedPassword);
   }
   ```

7. **Repository Interface**:

   **IMerchantRepository.cs**:
   ```csharp
   public interface IMerchantRepository
   {
       Task<Merchant?> GetByIdAsync(MerchantId id, CancellationToken ct = default);
       Task<Merchant?> GetByEmailAsync(Email email, CancellationToken ct = default);
       Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default);
       Task AddAsync(Merchant merchant, CancellationToken ct = default);
       void Update(Merchant merchant);
       Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default);
   }
   ```

8. **Domain Errors**:

   **IdentityErrors.cs**:
   ```csharp
   public static class IdentityErrors
   {
       public static readonly Error EmailAlreadyExists =
           new("Identity.EmailAlreadyExists", "Email is already registered");

       public static readonly Error InvalidCredentials =
           new("Identity.InvalidCredentials", "Invalid email or password");

       public static readonly Error MerchantNotFound =
           new("Identity.MerchantNotFound", "Merchant not found");

       public static readonly Error InvalidRefreshToken =
           new("Identity.InvalidRefreshToken", "Refresh token is invalid or expired");

       public static readonly Error AlreadyVerified =
           new("Identity.AlreadyVerified", "Merchant is already verified");

       public static readonly Error NameRequired =
           new("Identity.NameRequired", "Name is required");

       public static readonly Error NameInvalidLength =
           new("Identity.NameInvalidLength", "Name must be between 2 and 100 characters");

       // Add more as needed
   }
   ```

**Expected Output**:
- Complete Merchant aggregate with behaviors
- RefreshToken entity
- All value objects with validation
- Domain events for registration and password change
- Repository and service interfaces
- Error definitions

**Status**: [ ] Pending

---

### Task 1.3: Create Catalog Bounded Context - Domain Layer

**Agent**: `backend-developer`

**Description**:
Implement the Catalog bounded context domain layer including Store, Product, and Category aggregates with their value objects and domain events.

**Detailed Requirements**:

1. Create directory structure:
   ```
   Qaflaty.Domain/Catalog/
   ├── Aggregates/
   │   ├── Store/
   │   │   ├── Store.cs
   │   │   └── Events/
   │   │       ├── StoreCreatedEvent.cs
   │   │       └── StoreUpdatedEvent.cs
   │   ├── Product/
   │   │   ├── Product.cs
   │   │   └── Events/
   │   │       ├── ProductCreatedEvent.cs
   │   │       ├── ProductPriceChangedEvent.cs
   │   │       └── ProductStockChangedEvent.cs
   │   └── Category/
   │       └── Category.cs
   ├── ValueObjects/
   │   ├── StoreSlug.cs
   │   ├── StoreName.cs
   │   ├── StoreBranding.cs
   │   ├── DeliverySettings.cs
   │   ├── ProductSlug.cs
   │   ├── ProductName.cs
   │   ├── ProductPricing.cs
   │   ├── ProductInventory.cs
   │   ├── ProductImage.cs
   │   ├── CategoryName.cs
   │   └── CategorySlug.cs
   ├── Enums/
   │   ├── StoreStatus.cs
   │   └── ProductStatus.cs
   ├── Services/
   │   ├── ISlugGenerator.cs
   │   └── ISlugUniquenessChecker.cs
   ├── Repositories/
   │   ├── IStoreRepository.cs
   │   ├── IProductRepository.cs
   │   └── ICategoryRepository.cs
   └── Errors/
       └── CatalogErrors.cs
   ```

2. **Store Aggregate Root** (`Store.cs`):

   Properties:
   - Id: StoreId
   - MerchantId: MerchantId (reference to Identity context)
   - Slug: StoreSlug (unique, for subdomain)
   - CustomDomain: string? (optional custom domain)
   - Name: StoreName
   - Description: string?
   - Branding: StoreBranding (logo URL, primary color)
   - Status: StoreStatus (Active, Inactive, Suspended)
   - DeliverySettings: DeliverySettings
   - CreatedAt, UpdatedAt: DateTime

   Behaviors:
   - `static Create(merchantId, slug, name)` - Factory method, raises StoreCreatedEvent
   - `UpdateInfo(name, description)` - Update basic info
   - `UpdateBranding(branding)` - Update logo and colors
   - `UpdateDeliverySettings(settings)` - Update delivery fee, threshold
   - `SetCustomDomain(domain)` - Set custom domain
   - `Activate()` / `Deactivate()` - Toggle status

   Invariants:
   - Slug must be unique (validated at application layer)
   - Status transitions must be valid

3. **Product Aggregate Root** (`Product.cs`):

   Properties:
   - Id: ProductId
   - StoreId: StoreId
   - CategoryId: CategoryId? (optional)
   - Name: ProductName
   - Slug: ProductSlug (unique within store)
   - Description: string?
   - Pricing: ProductPricing (price, compareAtPrice)
   - Inventory: ProductInventory (quantity, sku, trackInventory)
   - Status: ProductStatus (Active, Inactive, Draft)
   - Images: List<ProductImage>
   - CreatedAt, UpdatedAt: DateTime

   Behaviors:
   - `static Create(storeId, name, pricing, inventory)` - Factory, raises ProductCreatedEvent
   - `UpdateInfo(name, description, categoryId)` - Update basic info
   - `UpdatePricing(pricing)` - Update price, raises ProductPriceChangedEvent if changed
   - `UpdateInventory(inventory)` - Update stock, raises ProductStockChangedEvent
   - `AddImage(image)` / `RemoveImage(imageId)` - Manage images
   - `ReorderImages(imageIds)` - Set image order
   - `Activate()` / `Deactivate()` - Toggle status
   - `ReserveStock(quantity)` - Reserve for order, returns Result
   - `RestoreStock(quantity)` - Restore after cancellation

   Invariants:
   - Price must be positive
   - CompareAtPrice must be > Price if set
   - Stock cannot go negative
   - Slug unique within store

4. **Category Aggregate Root** (`Category.cs`):

   Properties:
   - Id: CategoryId
   - StoreId: StoreId
   - ParentId: CategoryId? (for subcategories)
   - Name: CategoryName
   - Slug: CategorySlug (unique within store)
   - SortOrder: int
   - CreatedAt: DateTime

   Behaviors:
   - `static Create(storeId, name, slug, parentId?)` - Factory
   - `UpdateInfo(name)` - Update name
   - `SetParent(parentId)` - Move to different parent
   - `UpdateSortOrder(order)` - Change position

   Invariants:
   - Cannot be its own parent
   - Slug unique within store
   - Max depth of 2 levels for MVP

5. **Value Objects**:

   **StoreSlug.cs**:
   - Validation: 3-50 chars, lowercase alphanumeric + hyphens
   - Must start with letter, not end with hyphen
   - Reserved words check (www, api, admin, app, mail, ftp)
   - Method: `ToSubdomainUrl()` returns "{slug}.qaflaty.com"

   **StoreBranding.cs**:
   - LogoUrl: string?
   - PrimaryColor: string (hex, default #3B82F6)
   - Validation: Valid hex color format

   **DeliverySettings.cs**:
   - DeliveryFee: Money
   - FreeDeliveryThreshold: Money? (nullable)
   - Validation: Threshold > DeliveryFee if set

   **ProductPricing.cs**:
   - Price: Money
   - CompareAtPrice: Money?
   - Computed: HasDiscount, DiscountPercentage, DiscountAmount
   - Validation: Price > 0, CompareAtPrice > Price

   **ProductInventory.cs**:
   - Quantity: int
   - Sku: string?
   - TrackInventory: bool (default true)
   - Computed: InStock, LowStock (<=5)
   - Methods: Reserve(qty), Restock(qty), CanFulfill(qty)

   **ProductImage.cs**:
   - Id: Guid
   - Url: string
   - AltText: string?
   - SortOrder: int

6. **Enums**:

   **StoreStatus.cs**: Active, Inactive, Suspended

   **ProductStatus.cs**: Active, Inactive, Draft

7. **Repository Interfaces**:

   **IStoreRepository.cs**:
   ```csharp
   public interface IStoreRepository
   {
       Task<Store?> GetByIdAsync(StoreId id, CancellationToken ct = default);
       Task<Store?> GetBySlugAsync(StoreSlug slug, CancellationToken ct = default);
       Task<Store?> GetByCustomDomainAsync(string domain, CancellationToken ct = default);
       Task<IReadOnlyList<Store>> GetByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default);
       Task<bool> IsSlugAvailableAsync(StoreSlug slug, StoreId? excludeId = null, CancellationToken ct = default);
       Task AddAsync(Store store, CancellationToken ct = default);
       void Update(Store store);
       void Delete(Store store);
   }
   ```

   **IProductRepository.cs**:
   ```csharp
   public interface IProductRepository
   {
       Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct = default);
       Task<Product?> GetBySlugAsync(StoreId storeId, ProductSlug slug, CancellationToken ct = default);
       Task<IReadOnlyList<Product>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
       Task<bool> IsSlugAvailableAsync(StoreId storeId, ProductSlug slug, ProductId? excludeId = null, CancellationToken ct = default);
       Task AddAsync(Product product, CancellationToken ct = default);
       void Update(Product product);
       void Delete(Product product);
   }
   ```

   **ICategoryRepository.cs**: Similar pattern

8. **Domain Errors** (`CatalogErrors.cs`):
   - SlugAlreadyExists
   - SlugReserved
   - StoreNotFound
   - ProductNotFound
   - CategoryNotFound
   - InsufficientStock
   - InvalidPricing
   - etc.

**Expected Output**:
- Complete Store, Product, Category aggregates
- All value objects with validation
- Domain events for important state changes
- Repository interfaces
- Error definitions

**Status**: [ ] Pending

---

### Task 1.4: Create Ordering Bounded Context - Domain Layer

**Agent**: `backend-developer`

**Description**:
Implement the Ordering bounded context domain layer including Order and Customer aggregates with their entities, value objects, and domain events.

**Detailed Requirements**:

1. Create directory structure:
   ```
   Qaflaty.Domain/Ordering/
   ├── Aggregates/
   │   ├── Order/
   │   │   ├── Order.cs
   │   │   ├── OrderItem.cs
   │   │   ├── OrderStatusChange.cs
   │   │   └── Events/
   │   │       ├── OrderPlacedEvent.cs
   │   │       ├── OrderConfirmedEvent.cs
   │   │       ├── OrderShippedEvent.cs
   │   │       ├── OrderDeliveredEvent.cs
   │   │       ├── OrderCancelledEvent.cs
   │   │       └── PaymentProcessedEvent.cs
   │   └── Customer/
   │       └── Customer.cs
   ├── ValueObjects/
   │   ├── OrderNumber.cs
   │   ├── OrderPricing.cs
   │   ├── DeliveryInfo.cs
   │   ├── PaymentInfo.cs
   │   ├── Address.cs
   │   ├── CustomerContact.cs
   │   └── OrderNotes.cs
   ├── Enums/
   │   ├── OrderStatus.cs
   │   ├── PaymentStatus.cs
   │   └── PaymentMethod.cs
   ├── Services/
   │   ├── IOrderNumberGenerator.cs
   │   ├── IPaymentProcessor.cs
   │   └── IOrderPricingCalculator.cs
   ├── Repositories/
   │   ├── IOrderRepository.cs
   │   └── ICustomerRepository.cs
   └── Errors/
       └── OrderingErrors.cs
   ```

2. **Order Aggregate Root** (`Order.cs`):

   Properties:
   - Id: OrderId
   - StoreId: StoreId (reference to Catalog)
   - CustomerId: CustomerId
   - OrderNumber: OrderNumber (human-readable: QAF-XXXXXX)
   - Status: OrderStatus
   - Items: List<OrderItem> (entities)
   - Pricing: OrderPricing (subtotal, deliveryFee, total)
   - Payment: PaymentInfo (method, status, transactionId)
   - Delivery: DeliveryInfo (address, notes)
   - Notes: OrderNotes (customer notes, merchant notes)
   - StatusHistory: List<OrderStatusChange>
   - CreatedAt, UpdatedAt: DateTime

   Behaviors (with state machine enforcement):
   ```csharp
   // Factory method
   public static Result<Order> Create(
       StoreId storeId,
       CustomerId customerId,
       OrderNumber orderNumber,
       DeliveryInfo delivery,
       PaymentMethod paymentMethod,
       Money deliveryFee)

   // Item management (only when Pending)
   public Result AddItem(ProductId productId, string productName, Money unitPrice, int quantity)
   public Result RemoveItem(ProductId productId)
   public Result UpdateItemQuantity(ProductId productId, int newQuantity)

   // Status transitions
   public Result Confirm()      // Pending → Confirmed
   public Result Process()      // Confirmed → Processing
   public Result Ship()         // Processing → Shipped (requires payment)
   public Result Deliver()      // Shipped → Delivered
   public Result Cancel(string reason)  // Any (except Delivered) → Cancelled

   // Payment
   public Result ProcessPayment(string transactionId)
   public Result FailPayment(string reason)
   public Result Refund(string transactionId)

   // Notes
   public void AddMerchantNote(string note)
   ```

   Invariants:
   - Must have at least one item
   - Cannot modify items after Confirmed
   - Cannot ship without payment (unless COD)
   - Valid status transitions only
   - Total must equal sum of items + delivery fee

   State Machine:
   ```
   Pending → Confirmed → Processing → Shipped → Delivered
       ↓         ↓            ↓           ↓
       └─────────┴────────────┴───────────┴──→ Cancelled
   ```

3. **OrderItem Entity** (`OrderItem.cs`):
   ```csharp
   public sealed class OrderItem : Entity<OrderItemId>
   {
       public ProductId ProductId { get; private set; }
       public string ProductName { get; private set; }  // Snapshot
       public Money UnitPrice { get; private set; }      // Snapshot
       public int Quantity { get; private set; }
       public Money Total => UnitPrice * Quantity;

       // Private constructor + factory method
       public static OrderItem Create(ProductId productId, string name, Money price, int qty)

       public void UpdateQuantity(int newQuantity)
   }
   ```

4. **OrderStatusChange Entity** (`OrderStatusChange.cs`):
   ```csharp
   public sealed class OrderStatusChange : Entity<Guid>
   {
       public OrderStatus FromStatus { get; private set; }
       public OrderStatus ToStatus { get; private set; }
       public DateTime ChangedAt { get; private set; }
       public string? ChangedBy { get; private set; }  // MerchantId or "System"
       public string? Notes { get; private set; }
   }
   ```

5. **Customer Aggregate Root** (`Customer.cs`):

   Properties:
   - Id: CustomerId
   - StoreId: StoreId
   - Contact: CustomerContact (fullName, phone, email)
   - Address: Address
   - Notes: string? (merchant notes about customer)
   - CreatedAt: DateTime

   Behaviors:
   - `static Create(storeId, contact, address)` - Factory
   - `UpdateContact(contact)` - Update contact info
   - `UpdateAddress(address)` - Update address
   - `AddNote(note)` - Merchant adds note

   Note: Customer is per-store (same phone can have different customers in different stores)

6. **Value Objects**:

   **OrderNumber.cs**:
   - Value: string (format: QAF-XXXXXX)
   - Static: Generate() - creates new unique number
   - Static: Parse(string) - validates and creates

   **OrderPricing.cs**:
   - Subtotal: Money (sum of items)
   - DeliveryFee: Money
   - Total: Money (subtotal + delivery)
   - Method: Recalculate(items, deliveryFee)

   **DeliveryInfo.cs**:
   - Address: Address
   - Instructions: string? (delivery instructions)

   **PaymentInfo.cs**:
   - Method: PaymentMethod
   - Status: PaymentStatus
   - TransactionId: string?
   - PaidAt: DateTime?
   - FailureReason: string?

   **Address.cs**:
   - Street: string
   - City: string
   - District: string?
   - PostalCode: string?
   - Country: string (default "Saudi Arabia")
   - AdditionalInfo: string?
   - Methods: ToSingleLine(), ToMultiLine()

   **CustomerContact.cs**:
   - FullName: PersonName
   - Phone: PhoneNumber
   - Email: Email?

   **OrderNotes.cs**:
   - CustomerNotes: string?
   - MerchantNotes: string?

7. **Enums**:

   **OrderStatus.cs**: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled

   **PaymentStatus.cs**: Pending, Paid, Failed, Refunded

   **PaymentMethod.cs**: CashOnDelivery, Card, Wallet

8. **Domain Events**:

   **OrderPlacedEvent.cs**:
   ```csharp
   public sealed record OrderPlacedEvent(
       OrderId OrderId,
       StoreId StoreId,
       CustomerId CustomerId,
       OrderNumber OrderNumber,
       IReadOnlyList<OrderItemSnapshot> Items,
       Money Total
   ) : DomainEvent;

   public record OrderItemSnapshot(ProductId ProductId, int Quantity);
   ```

   **OrderConfirmedEvent.cs**, **OrderShippedEvent.cs**, etc.

   **PaymentProcessedEvent.cs**:
   ```csharp
   public sealed record PaymentProcessedEvent(
       OrderId OrderId,
       string TransactionId,
       Money Amount
   ) : DomainEvent;
   ```

9. **Domain Service Interfaces**:

   **IOrderNumberGenerator.cs**:
   ```csharp
   public interface IOrderNumberGenerator
   {
       Task<OrderNumber> GenerateAsync(StoreId storeId, CancellationToken ct = default);
   }
   ```

   **IPaymentProcessor.cs**:
   ```csharp
   public interface IPaymentProcessor
   {
       Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken ct = default);
       Task<PaymentResult> RefundAsync(RefundRequest request, CancellationToken ct = default);
   }

   public record PaymentRequest(OrderId OrderId, Money Amount, PaymentMethod Method);
   public record PaymentResult(bool Success, string? TransactionId, string? ErrorMessage);
   ```

10. **Repository Interfaces**:

    **IOrderRepository.cs**:
    ```csharp
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(OrderId id, CancellationToken ct = default);
        Task<Order?> GetByOrderNumberAsync(StoreId storeId, OrderNumber orderNumber, CancellationToken ct = default);
        Task<IReadOnlyList<Order>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
        Task<IReadOnlyList<Order>> GetByCustomerIdAsync(CustomerId customerId, CancellationToken ct = default);
        Task AddAsync(Order order, CancellationToken ct = default);
        void Update(Order order);
    }
    ```

11. **Domain Errors** (`OrderingErrors.cs`):
    - OrderNotFound
    - InvalidStatusTransition
    - OrderAlreadyConfirmed
    - InsufficientStock
    - PaymentRequired
    - PaymentFailed
    - EmptyOrder
    - etc.

**Expected Output**:
- Complete Order aggregate with state machine
- OrderItem and OrderStatusChange entities
- Customer aggregate
- All value objects with validation
- Domain events for order lifecycle
- Service and repository interfaces

**Status**: [ ] Pending

---

### Task 1.5: Create Docker Compose for Local Development

**Agent**: `devops-engineer`

**Description**:
Set up Docker Compose for local development with PostgreSQL database.

**Detailed Requirements**:

1. Create `docker-compose.yml` in root directory:

   **PostgreSQL Service**:
   - Image: `postgres:16-alpine`
   - Container name: `qaflaty-db`
   - Environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
   - Port: 5432:5432
   - Volume: `qaflaty-postgres-data:/var/lib/postgresql/data`
   - Health check configuration

   **pgAdmin Service** (optional):
   - Image: `dpage/pgadmin4:latest`
   - Port: 5050:80
   - Depends on postgres

2. Create `.env.example`:
   ```
   POSTGRES_USER=qaflaty
   POSTGRES_PASSWORD=qaflaty_dev_123
   POSTGRES_DB=qaflaty_db

   PGADMIN_EMAIL=admin@qaflaty.com
   PGADMIN_PASSWORD=admin123
   ```

3. Update `appsettings.Development.json` with connection string

4. Create PowerShell/Bash scripts in `scripts/`:
   - `start-db.ps1` / `start-db.sh`
   - `stop-db.ps1` / `stop-db.sh`
   - `reset-db.ps1` / `reset-db.sh`

5. Add Docker entries to `.gitignore`

**Expected Output**:
- Docker Compose configuration
- Easy database management scripts
- Development environment ready

**Status**: [ ] Pending

---

## Phase 2: Application Layer & Infrastructure

### Task 2.1: Create Application Layer - Common Infrastructure

**Agent**: `backend-developer`

**Description**:
Set up the Application layer with MediatR, CQRS infrastructure, behaviors, and common interfaces.

**Detailed Requirements**:

1. Create directory structure:
   ```
   Qaflaty.Application/
   ├── Common/
   │   ├── Interfaces/
   │   │   ├── IUnitOfWork.cs
   │   │   ├── ICurrentUserService.cs
   │   │   ├── ITenantContext.cs
   │   │   └── IDateTimeProvider.cs
   │   ├── Behaviors/
   │   │   ├── ValidationBehavior.cs
   │   │   ├── LoggingBehavior.cs
   │   │   └── UnitOfWorkBehavior.cs
   │   ├── Exceptions/
   │   │   ├── ValidationException.cs
   │   │   └── NotFoundException.cs
   │   └── Mappings/
   │       └── IMapFrom.cs
   ├── Identity/
   ├── Catalog/
   └── Ordering/
   ```

2. **Common Interfaces**:

   **IUnitOfWork.cs**:
   ```csharp
   public interface IUnitOfWork
   {
       Task<int> SaveChangesAsync(CancellationToken ct = default);
   }
   ```

   **ICurrentUserService.cs**:
   ```csharp
   public interface ICurrentUserService
   {
       MerchantId? MerchantId { get; }
       bool IsAuthenticated { get; }
   }
   ```

   **ITenantContext.cs**:
   ```csharp
   public interface ITenantContext
   {
       StoreId? CurrentStoreId { get; }
       Store? CurrentStore { get; }
       bool IsResolved { get; }
       void SetStore(Store store);
   }
   ```

3. **MediatR Pipeline Behaviors**:

   **ValidationBehavior.cs**:
   - Runs FluentValidation validators before handler
   - Collects all validation errors
   - Throws ValidationException if any errors

   **LoggingBehavior.cs**:
   - Logs command/query name, execution time
   - Logs errors if handler fails

   **UnitOfWorkBehavior.cs**:
   - Wraps commands in transaction
   - Calls SaveChangesAsync after successful command
   - Only for commands (not queries)

4. **CQRS Base Types**:

   **ICommand.cs** / **IQuery.cs**:
   ```csharp
   public interface ICommand : IRequest<Result> { }
   public interface ICommand<TResponse> : IRequest<Result<TResponse>> { }
   public interface IQuery<TResponse> : IRequest<TResponse> { }
   ```

   **ICommandHandler.cs** / **IQueryHandler.cs**:
   ```csharp
   public interface ICommandHandler<TCommand> : IRequestHandler<TCommand, Result>
       where TCommand : ICommand { }

   public interface ICommandHandler<TCommand, TResponse>
       : IRequestHandler<TCommand, Result<TResponse>>
       where TCommand : ICommand<TResponse> { }

   public interface IQueryHandler<TQuery, TResponse>
       : IRequestHandler<TQuery, TResponse>
       where TQuery : IQuery<TResponse> { }
   ```

5. **Domain Event Dispatcher**:
   ```csharp
   public interface IDomainEventDispatcher
   {
       Task DispatchEventsAsync(IEnumerable<IDomainEvent> events, CancellationToken ct = default);
   }
   ```

6. **Dependency Injection Extension**:
   ```csharp
   public static class DependencyInjection
   {
       public static IServiceCollection AddApplication(this IServiceCollection services)
       {
           services.AddMediatR(cfg => {
               cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
               cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
               cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
               cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(UnitOfWorkBehavior<,>));
           });

           services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

           return services;
       }
   }
   ```

**Expected Output**:
- MediatR configured with behaviors
- CQRS base types
- Common interfaces
- Validation pipeline

**Status**: [ ] Pending

---

### Task 2.2: Create Application Layer - Identity Use Cases

**Agent**: `backend-developer`

**Description**:
Implement all Identity context use cases (commands and queries) using CQRS pattern.

**Detailed Requirements**:

1. Create directory structure:
   ```
   Qaflaty.Application/Identity/
   ├── Commands/
   │   ├── Register/
   │   │   ├── RegisterCommand.cs
   │   │   ├── RegisterCommandHandler.cs
   │   │   └── RegisterCommandValidator.cs
   │   ├── Login/
   │   │   ├── LoginCommand.cs
   │   │   ├── LoginCommandHandler.cs
   │   │   └── LoginCommandValidator.cs
   │   ├── RefreshToken/
   │   │   ├── RefreshTokenCommand.cs
   │   │   ├── RefreshTokenCommandHandler.cs
   │   │   └── RefreshTokenCommandValidator.cs
   │   ├── ChangePassword/
   │   │   ├── ChangePasswordCommand.cs
   │   │   ├── ChangePasswordCommandHandler.cs
   │   │   └── ChangePasswordCommandValidator.cs
   │   └── Logout/
   │       ├── LogoutCommand.cs
   │       └── LogoutCommandHandler.cs
   ├── Queries/
   │   └── GetCurrentMerchant/
   │       ├── GetCurrentMerchantQuery.cs
   │       ├── GetCurrentMerchantQueryHandler.cs
   │       └── MerchantDto.cs
   ├── DTOs/
   │   └── AuthResponse.cs
   └── Services/
       └── ITokenService.cs
   ```

2. **Register Command**:
   ```csharp
   public record RegisterCommand(
       string Email,
       string Password,
       string FullName,
       string? Phone
   ) : ICommand<AuthResponse>;
   ```

   Handler:
   - Validate email not exists
   - Create Email, PersonName value objects
   - Hash password
   - Create Merchant aggregate
   - Generate tokens
   - Return AuthResponse

   Validator:
   - Email: required, valid format
   - Password: required, min 8 chars, complexity rules
   - FullName: required, 2-100 chars
   - Phone: optional, valid format if provided

3. **Login Command**:
   ```csharp
   public record LoginCommand(
       string Email,
       string Password
   ) : ICommand<AuthResponse>;
   ```

   Handler:
   - Find merchant by email
   - Verify password
   - Generate tokens
   - Add refresh token to merchant
   - Return AuthResponse

4. **RefreshToken Command**:
   ```csharp
   public record RefreshTokenCommand(
       string RefreshToken
   ) : ICommand<AuthResponse>;
   ```

   Handler:
   - Find valid refresh token
   - Revoke old token
   - Generate new tokens
   - Add new refresh token
   - Return AuthResponse

5. **ChangePassword Command**:
   ```csharp
   public record ChangePasswordCommand(
       string CurrentPassword,
       string NewPassword
   ) : ICommand;
   ```

   Handler:
   - Get current merchant from ICurrentUserService
   - Verify current password
   - Hash new password
   - Call merchant.ChangePassword()
   - Revoke all refresh tokens

6. **Logout Command**:
   ```csharp
   public record LogoutCommand(
       string RefreshToken
   ) : ICommand;
   ```

   Handler:
   - Revoke the refresh token

7. **GetCurrentMerchant Query**:
   ```csharp
   public record GetCurrentMerchantQuery : IQuery<MerchantDto>;
   ```

   Handler:
   - Get merchant from ICurrentUserService
   - Map to MerchantDto

8. **DTOs**:

   **AuthResponse.cs**:
   ```csharp
   public record AuthResponse(
       string AccessToken,
       string RefreshToken,
       DateTime ExpiresAt,
       MerchantDto Merchant
   );
   ```

   **MerchantDto.cs**:
   ```csharp
   public record MerchantDto(
       Guid Id,
       string Email,
       string FullName,
       string? Phone,
       bool IsVerified,
       DateTime CreatedAt
   );
   ```

9. **ITokenService**:
   ```csharp
   public interface ITokenService
   {
       string GenerateAccessToken(Merchant merchant);
       string GenerateRefreshToken();
       DateTime GetAccessTokenExpiration();
       DateTime GetRefreshTokenExpiration();
       MerchantId? ValidateAccessToken(string token);
   }
   ```

**Expected Output**:
- All authentication commands and queries
- FluentValidation validators
- DTOs for responses
- Token service interface

**Status**: [ ] Pending

---

### Task 2.3: Create Application Layer - Catalog Use Cases

**Agent**: `backend-developer`

**Description**:
Implement all Catalog context use cases for Stores, Products, and Categories.

**Detailed Requirements**:

1. **Store Commands**:
   - `CreateStoreCommand` - Create new store
   - `UpdateStoreCommand` - Update store info
   - `UpdateStoreBrandingCommand` - Update logo/colors
   - `UpdateDeliverySettingsCommand` - Update delivery settings
   - `DeleteStoreCommand` - Delete store
   - `CheckSlugAvailabilityCommand` - Check if slug is available

2. **Store Queries**:
   - `GetStoreByIdQuery` - Get store by ID (merchant view)
   - `GetStoreBySlugQuery` - Get store by slug (public, for storefront)
   - `GetMerchantStoresQuery` - Get all stores for current merchant

3. **Product Commands**:
   - `CreateProductCommand` - Create new product
   - `UpdateProductCommand` - Update product info
   - `UpdateProductPricingCommand` - Update pricing
   - `UpdateProductInventoryCommand` - Update stock
   - `DeleteProductCommand` - Delete product
   - `ToggleProductStatusCommand` - Activate/deactivate

4. **Product Queries**:
   - `GetProductByIdQuery` - Get product by ID
   - `GetProductBySlugQuery` - Get by slug (for storefront)
   - `GetProductsQuery` - List with filtering, pagination
   - `GetStorefrontProductsQuery` - Public listing (active only)

5. **Category Commands**:
   - `CreateCategoryCommand` - Create category
   - `UpdateCategoryCommand` - Update category
   - `DeleteCategoryCommand` - Delete category
   - `ReorderCategoriesCommand` - Update sort orders

6. **Category Queries**:
   - `GetCategoriesQuery` - List categories for store
   - `GetCategoryTreeQuery` - Hierarchical structure

7. **DTOs**:
   - `StoreDto`, `StoreListDto`, `StorePublicDto`
   - `ProductDto`, `ProductListDto`, `ProductPublicDto`
   - `CategoryDto`, `CategoryTreeDto`
   - `PaginatedList<T>` - Generic pagination response

8. Each command/query should have:
   - Request record
   - Handler
   - Validator (for commands)
   - Authorization checks (verify ownership)

**Expected Output**:
- Complete CRUD operations for Store, Product, Category
- Public and private queries
- Pagination support
- All validators

**Status**: [ ] Pending

---

### Task 2.4: Create Application Layer - Ordering Use Cases

**Agent**: `backend-developer`

**Description**:
Implement all Ordering context use cases for Orders and Customers.

**Detailed Requirements**:

1. **Order Commands**:
   - `PlaceOrderCommand` - Create order from storefront (public)
   - `ConfirmOrderCommand` - Merchant confirms order
   - `ProcessOrderCommand` - Mark as processing
   - `ShipOrderCommand` - Mark as shipped
   - `DeliverOrderCommand` - Mark as delivered
   - `CancelOrderCommand` - Cancel order
   - `AddOrderNoteCommand` - Add merchant note

2. **Order Queries**:
   - `GetOrderByIdQuery` - Get order details (merchant)
   - `GetStoreOrdersQuery` - List orders with filtering
   - `TrackOrderQuery` - Public order tracking by order number
   - `GetOrderStatsQuery` - Order statistics for dashboard

3. **Customer Queries**:
   - `GetCustomerByIdQuery` - Customer details
   - `GetStoreCustomersQuery` - List customers
   - `GetCustomerOrdersQuery` - Customer's order history

4. **Customer Commands**:
   - `UpdateCustomerNotesCommand` - Merchant notes

5. **Payment Commands**:
   - `ProcessPaymentCommand` - Process payment (mocked)
   - `RefundPaymentCommand` - Refund (mocked)

6. **Domain Event Handlers**:
   - `OrderPlacedEventHandler` - Reduce stock in Catalog context
   - `OrderCancelledEventHandler` - Restore stock
   - (Future: Send notifications)

7. **DTOs**:
   - `OrderDto`, `OrderListDto`, `OrderTrackingDto`
   - `OrderItemDto`
   - `CustomerDto`, `CustomerListDto`
   - `OrderStatsDto`
   - `PaymentResultDto`

**Expected Output**:
- Complete order lifecycle management
- Customer management
- Payment processing (mocked)
- Domain event handlers for cross-context communication

**Status**: [x] Completed

---

### Task 2.5: Create Infrastructure Layer - Persistence

**Agent**: `backend-developer`

**Description**:
Implement Entity Framework Core persistence with proper DDD mapping.

**Detailed Requirements**:

1. Create directory structure:
   ```
   Qaflaty.Infrastructure/
   ├── Persistence/
   │   ├── QaflatyDbContext.cs
   │   ├── UnitOfWork.cs
   │   ├── Configurations/
   │   │   ├── Identity/
   │   │   │   ├── MerchantConfiguration.cs
   │   │   │   └── RefreshTokenConfiguration.cs
   │   │   ├── Catalog/
   │   │   │   ├── StoreConfiguration.cs
   │   │   │   ├── ProductConfiguration.cs
   │   │   │   └── CategoryConfiguration.cs
   │   │   └── Ordering/
   │   │       ├── OrderConfiguration.cs
   │   │       ├── OrderItemConfiguration.cs
   │   │       └── CustomerConfiguration.cs
   │   ├── Repositories/
   │   │   ├── MerchantRepository.cs
   │   │   ├── StoreRepository.cs
   │   │   ├── ProductRepository.cs
   │   │   ├── CategoryRepository.cs
   │   │   ├── OrderRepository.cs
   │   │   └── CustomerRepository.cs
   │   ├── Migrations/
   │   └── Interceptors/
   │       ├── DomainEventDispatcherInterceptor.cs
   │       └── AuditableEntityInterceptor.cs
   ```

2. **QaflatyDbContext**:
   - Configure all DbSets
   - Apply all configurations from assembly
   - Override SaveChangesAsync to dispatch domain events

3. **Entity Configurations**:

   For each aggregate:
   - Map strongly typed IDs with value converters
   - Map value objects as owned entities or JSON columns
   - Configure relationships and cascade behavior
   - Set up indexes for performance
   - Configure unique constraints

   Example for Product:
   ```csharp
   public class ProductConfiguration : IEntityTypeConfiguration<Product>
   {
       public void Configure(EntityTypeBuilder<Product> builder)
       {
           builder.ToTable("products");

           builder.HasKey(p => p.Id);

           builder.Property(p => p.Id)
               .HasConversion(
                   id => id.Value,
                   value => new ProductId(value));

           builder.OwnsOne(p => p.Pricing, pricing =>
           {
               pricing.OwnsOne(pr => pr.Price, money =>
               {
                   money.Property(m => m.Amount).HasColumnName("price");
                   money.Property(m => m.Currency).HasColumnName("price_currency");
               });
               // ... CompareAtPrice
           });

           builder.OwnsOne(p => p.Inventory, inv =>
           {
               inv.Property(i => i.Quantity).HasColumnName("stock_quantity");
               inv.Property(i => i.Sku).HasColumnName("sku");
           });

           builder.Property(p => p.Images)
               .HasColumnType("jsonb")
               .HasConversion(/* JSON conversion */);

           builder.HasIndex(p => new { p.StoreId, p.Slug }).IsUnique();
       }
   }
   ```

4. **Repository Implementations**:
   - Implement all repository interfaces
   - Use IQueryable for efficient queries
   - Include related entities where needed

5. **Interceptors**:

   **DomainEventDispatcherInterceptor**:
   - Before SaveChanges, collect domain events from all aggregates
   - After SaveChanges, dispatch events via MediatR
   - Clear events from aggregates

   **AuditableEntityInterceptor**:
   - Set CreatedAt on insert
   - Set UpdatedAt on update

6. **UnitOfWork Implementation**:
   ```csharp
   public class UnitOfWork : IUnitOfWork
   {
       private readonly QaflatyDbContext _context;

       public Task<int> SaveChangesAsync(CancellationToken ct = default)
           => _context.SaveChangesAsync(ct);
   }
   ```

7. Create initial migration: `InitialCreate`

**Expected Output**:
- Complete EF Core configuration
- All repositories implemented
- Domain event dispatching on save
- Proper value object mapping
- Initial migration

**Status**: [x] Completed

---

### Task 2.6: Create Infrastructure Layer - Services

**Agent**: `backend-developer`

**Description**:
Implement all infrastructure services including authentication, payment, and utilities.

**Detailed Requirements**:

1. Create directory structure:
   ```
   Qaflaty.Infrastructure/
   ├── Services/
   │   ├── Identity/
   │   │   ├── PasswordHasher.cs
   │   │   ├── JwtTokenService.cs
   │   │   └── CurrentUserService.cs
   │   ├── Catalog/
   │   │   └── SlugGenerator.cs
   │   ├── Ordering/
   │   │   ├── OrderNumberGenerator.cs
   │   │   └── MockPaymentProcessor.cs
   │   └── Common/
   │       ├── DateTimeProvider.cs
   │       └── TenantContext.cs
   ```

2. **PasswordHasher.cs**:
   - Use BCrypt.Net
   - Implement IPasswordHasher interface

3. **JwtTokenService.cs**:
   - Generate JWT access tokens
   - Configure from settings (secret, issuer, audience, expiration)
   - Include claims: MerchantId, Email
   - Generate random refresh tokens
   - Validate tokens

4. **CurrentUserService.cs**:
   - Read MerchantId from HttpContext.User claims
   - Implement ICurrentUserService

5. **SlugGenerator.cs**:
   - Generate slug from name
   - Handle special characters, transliteration
   - Implement ISlugGenerator

6. **OrderNumberGenerator.cs**:
   - Generate unique order numbers: QAF-XXXXXX
   - Use combination of timestamp and random
   - Ensure uniqueness within store
   - Implement IOrderNumberGenerator

7. **MockPaymentProcessor.cs**:
   - Simulate payment processing
   - Configurable success rate
   - Test card numbers:
     - 4111111111111111 → Always success
     - 4000000000000002 → Always fail (insufficient funds)
   - Simulate network delay
   - Implement IPaymentProcessor

8. **TenantContext.cs**:
   - Scoped service for current store context
   - Implement ITenantContext

9. **DateTimeProvider.cs**:
   - Implement IDateTimeProvider
   - Allows mocking in tests

10. **DependencyInjection**:
    ```csharp
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // DbContext
            // Repositories
            // Services
            // Return services
        }
    }
    ```

**Expected Output**:
- All infrastructure services implemented
- JWT authentication working
- Mock payment processor
- Dependency injection configured

**Status**: [x] Completed

---

## Phase 3: API Layer & Authentication

### Task 3.1: Create API Controllers - Identity

**Agent**: `backend-developer`

**Description**:
Create the Identity API controllers with proper authentication setup.

**Detailed Requirements**:

1. Configure JWT authentication in `Program.cs`:
   - Add authentication services
   - Configure JWT bearer options
   - Add authorization policies

2. Create `AuthController.cs`:
   ```csharp
   [ApiController]
   [Route("api/auth")]
   public class AuthController : ControllerBase
   {
       [HttpPost("register")]
       public async Task<IActionResult> Register(RegisterRequest request)

       [HttpPost("login")]
       public async Task<IActionResult> Login(LoginRequest request)

       [HttpPost("refresh")]
       public async Task<IActionResult> Refresh(RefreshTokenRequest request)

       [HttpPost("logout")]
       [Authorize]
       public async Task<IActionResult> Logout(LogoutRequest request)

       [HttpGet("me")]
       [Authorize]
       public async Task<IActionResult> GetCurrentMerchant()

       [HttpPost("change-password")]
       [Authorize]
       public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
   }
   ```

3. Create API request/response models:
   - Map to/from Application layer DTOs
   - Use FluentValidation for request validation

4. Create custom `[Authorize]` attributes if needed

5. Add global exception handling middleware

6. Configure Swagger with JWT authentication

**Expected Output**:
- Complete authentication endpoints
- JWT authentication working
- Swagger documentation with auth

**Status**: [ ] Pending

---

### Task 3.2: Create API Controllers - Catalog

**Agent**: `backend-developer`

**Description**:
Create the Catalog API controllers for Stores, Products, and Categories.

**Detailed Requirements**:

1. Create `StoresController.cs`:
   ```csharp
   [ApiController]
   [Route("api/stores")]
   [Authorize]
   public class StoresController : ControllerBase
   {
       [HttpGet]
       public async Task<IActionResult> GetMyStores()

       [HttpGet("{id}")]
       public async Task<IActionResult> GetStore(Guid id)

       [HttpPost]
       public async Task<IActionResult> CreateStore(CreateStoreRequest request)

       [HttpPut("{id}")]
       public async Task<IActionResult> UpdateStore(Guid id, UpdateStoreRequest request)

       [HttpPut("{id}/branding")]
       public async Task<IActionResult> UpdateBranding(Guid id, UpdateBrandingRequest request)

       [HttpPut("{id}/delivery")]
       public async Task<IActionResult> UpdateDeliverySettings(Guid id, UpdateDeliveryRequest request)

       [HttpDelete("{id}")]
       public async Task<IActionResult> DeleteStore(Guid id)

       [HttpPost("check-slug")]
       public async Task<IActionResult> CheckSlugAvailability(CheckSlugRequest request)
   }
   ```

2. Create `ProductsController.cs`:
   - All CRUD operations
   - Filtering and pagination
   - Authorization checks

3. Create `CategoriesController.cs`:
   - CRUD operations
   - Tree structure endpoint

4. Verify ownership on all mutations:
   - Store must belong to current merchant
   - Product/Category must belong to merchant's store

**Expected Output**:
- Complete Catalog API endpoints
- Authorization working
- Proper error responses

**Status**: [ ] Pending

---

### Task 3.3: Create API Controllers - Storefront (Public)

**Agent**: `backend-developer`

**Description**:
Create the public Storefront API controllers with tenant resolution.

**Detailed Requirements**:

1. Create tenant resolution middleware:
   ```csharp
   public class TenantMiddleware
   {
       public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
       {
           // Read X-Store-Slug or X-Custom-Domain header
           // Look up store
           // Set in tenant context
           // Continue pipeline
       }
   }
   ```

2. Create `StorefrontController.cs`:
   ```csharp
   [ApiController]
   [Route("api/storefront")]
   public class StorefrontController : ControllerBase
   {
       [HttpGet("store")]
       public async Task<IActionResult> GetStoreInfo()

       [HttpGet("categories")]
       public async Task<IActionResult> GetCategories()

       [HttpGet("products")]
       public async Task<IActionResult> GetProducts([FromQuery] ProductFilterRequest filter)

       [HttpGet("products/{slug}")]
       public async Task<IActionResult> GetProduct(string slug)

       [HttpPost("cart/validate")]
       public async Task<IActionResult> ValidateCart(ValidateCartRequest request)
   }
   ```

3. Create `StorefrontOrdersController.cs`:
   ```csharp
   [ApiController]
   [Route("api/storefront/orders")]
   public class StorefrontOrdersController : ControllerBase
   {
       [HttpPost]
       public async Task<IActionResult> PlaceOrder(PlaceOrderRequest request)

       [HttpGet("track/{orderNumber}")]
       public async Task<IActionResult> TrackOrder(string orderNumber)
   }
   ```

4. All storefront endpoints:
   - Require tenant context
   - Return 404 if store not found or inactive
   - Only return active products/categories

**Expected Output**:
- Public storefront API
- Tenant resolution working
- Order placement endpoint

**Status**: [ ] Pending

---

### Task 3.4: Create API Controllers - Ordering

**Agent**: `backend-developer`

**Description**:
Create the Ordering API controllers for merchants.

**Detailed Requirements**:

1. Create `OrdersController.cs`:
   ```csharp
   [ApiController]
   [Route("api/orders")]
   [Authorize]
   public class OrdersController : ControllerBase
   {
       [HttpGet]
       public async Task<IActionResult> GetOrders([FromQuery] OrderFilterRequest filter)

       [HttpGet("{id}")]
       public async Task<IActionResult> GetOrder(Guid id)

       [HttpPatch("{id}/confirm")]
       public async Task<IActionResult> ConfirmOrder(Guid id)

       [HttpPatch("{id}/process")]
       public async Task<IActionResult> ProcessOrder(Guid id)

       [HttpPatch("{id}/ship")]
       public async Task<IActionResult> ShipOrder(Guid id)

       [HttpPatch("{id}/deliver")]
       public async Task<IActionResult> DeliverOrder(Guid id)

       [HttpPatch("{id}/cancel")]
       public async Task<IActionResult> CancelOrder(Guid id, CancelOrderRequest request)

       [HttpPost("{id}/notes")]
       public async Task<IActionResult> AddNote(Guid id, AddNoteRequest request)

       [HttpGet("stats")]
       public async Task<IActionResult> GetStats([FromQuery] Guid storeId)
   }
   ```

2. Create `CustomersController.cs`:
   - List customers
   - Get customer details with order history
   - Update notes

3. Create `DashboardController.cs`:
   - Dashboard statistics
   - Recent orders
   - Top products
   - Sales chart data

**Expected Output**:
- Complete order management API
- Customer management API
- Dashboard statistics API

**Status**: [ ] Pending

---

## Phase 4: Angular Frontend

### Task 4.1: Initialize Angular Workspace

**Agent**: `frontend-developer`

**Description**:
Create Angular workspace with three applications following the architecture from Phase 1.

**Detailed Requirements**:

1. Create Angular 19 workspace in `clients/` folder
2. Create three applications: landing, store, merchant
3. Create shared library for common code
4. Configure Tailwind CSS
5. Set up environment configurations
6. Configure proxy for local development
7. Create basic folder structure per app

See original Task 1.4 for full details.

**Status**: [ ] Pending

---

### Task 4.2: Implement Merchant App - Authentication

**Agent**: `frontend-developer`

**Description**:
Implement authentication in the Merchant Angular application.

**Detailed Requirements**:

1. Create auth service with token management
2. Create HTTP interceptors for auth and errors
3. Create auth guards
4. Create login and registration pages
5. Create shell component for authenticated pages
6. Style with Tailwind CSS

See original Task 2.2 for full details.

**Status**: [ ] Pending

---

### Task 4.3: Implement Merchant App - Store Management

**Agent**: `frontend-developer`

**Description**:
Create store management UI in Merchant application.

**Detailed Requirements**:

1. Store list page
2. Create store page with slug validation
3. Store settings page (general, branding, delivery)
4. Reusable components (StoreCard, SlugInput, ColorPicker)

See original Task 3.2 for full details.

**Status**: [ ] Pending

---

### Task 4.4: Implement Merchant App - Product Management

**Agent**: `frontend-developer`

**Description**:
Create product and category management UI.

**Detailed Requirements**:

1. Product list with filtering and pagination
2. Create/Edit product form
3. Category management (tree view)
4. Image management
5. Reusable components

See original Task 4.3 for full details.

**Status**: [ ] Pending

---

### Task 4.5: Implement Merchant App - Order Management

**Agent**: `frontend-developer`

**Description**:
Create order management UI.

**Detailed Requirements**:

1. Order list with filtering
2. Order detail page with status management
3. Order statistics widget
4. Reusable components (StatusBadge, Timeline)

See original Task 6.3 for full details.

**Status**: [ ] Pending

---

### Task 4.6: Implement Merchant App - Dashboard

**Agent**: `frontend-developer`

**Description**:
Create the main dashboard page.

**Detailed Requirements**:

1. Statistics cards
2. Sales chart
3. Recent orders list
4. Top products list
5. Responsive layout

See original Task 7.2 for full details.

**Status**: [ ] Pending

---

### Task 4.7: Implement Merchant App - Settings & Profile

**Agent**: `frontend-developer`

**Description**:
Create settings and profile management.

**Detailed Requirements**:

1. Profile settings
2. Password change
3. Store settings
4. Notification preferences (placeholder)

See original Task 10.2 for full details.

**Status**: [ ] Pending

---

### Task 4.8: Implement Merchant App - Customer Management

**Agent**: `frontend-developer`

**Description**:
Create customer management UI.

**Detailed Requirements**:

1. Customer list with search
2. Customer detail with order history
3. Merchant notes functionality

See original Task 9.2 for full details.

**Status**: [ ] Pending

---

### Task 4.9: Implement Store App - Complete Storefront

**Agent**: `frontend-developer`

**Description**:
Build the complete customer storefront application.

**Detailed Requirements**:

1. Tenant detection and theming
2. Home page
3. Product listing and detail pages
4. Shopping cart
5. Checkout flow
6. Order confirmation
7. Order tracking
8. Responsive design

See original Task 5.3 for full details.

**Status**: [ ] Pending

---

### Task 4.10: Implement Landing Page

**Agent**: `frontend-developer`

**Description**:
Build the marketing landing page.

**Detailed Requirements**:

1. Hero section
2. Features grid
3. How it works
4. Pricing (beta message)
5. CTA sections
6. Footer
7. Responsive design
8. SEO optimization

See original Task 8.1 for full details.

**Status**: [ ] Pending

---

## Phase 5: Testing & Quality

### Task 5.1: Add Domain Layer Unit Tests

**Agent**: `backend-developer`

**Description**:
Create comprehensive unit tests for the Domain layer.

**Detailed Requirements**:

1. Test all aggregate behaviors:
   - Merchant registration, password change
   - Store creation, updates
   - Product inventory management
   - Order state machine transitions

2. Test all value objects:
   - Validation rules
   - Equality
   - Factory methods

3. Test domain events are raised correctly

4. Use xUnit, FluentAssertions
5. Aim for >90% code coverage on domain

**Status**: [ ] Pending

---

### Task 5.2: Add Application Layer Unit Tests

**Agent**: `backend-developer`

**Description**:
Create unit tests for Application layer handlers.

**Detailed Requirements**:

1. Test all command handlers:
   - Happy path
   - Validation failures
   - Business rule violations

2. Test all query handlers

3. Mock repositories and services

4. Use xUnit, Moq, FluentAssertions

**Status**: [ ] Pending

---

### Task 5.3: Add Integration Tests

**Agent**: `backend-developer`

**Description**:
Create integration tests for API endpoints.

**Detailed Requirements**:

1. Set up WebApplicationFactory
2. Test authentication flows
3. Test CRUD operations
4. Test authorization
5. Test error handling

See original Task 11.2 for details.

**Status**: [ ] Pending

---

### Task 5.4: Add E2E Tests

**Agent**: `frontend-developer`

**Description**:
Create end-to-end tests for critical flows.

**Detailed Requirements**:

1. Set up Playwright
2. Test merchant flows (auth, store, products, orders)
3. Test customer flows (browse, cart, checkout)
4. Cross-browser testing

See original Task 11.3 for details.

**Status**: [ ] Pending

---

## Phase 6: Deployment

### Task 6.1: Prepare Backend for Production

**Agent**: `devops-engineer`

**Description**:
Prepare .NET API for production deployment.

**Detailed Requirements**:

1. Create Dockerfile
2. Configure for production
3. Security hardening
4. Health checks
5. Logging configuration

See original Task 12.1 for details.

**Status**: [ ] Pending

---

### Task 6.2: Prepare Frontend for Production

**Agent**: `frontend-developer`

**Description**:
Prepare Angular apps for production.

**Detailed Requirements**:

1. Production builds
2. Environment configuration
3. Asset optimization
4. Deployment configs

See original Task 12.2 for details.

**Status**: [ ] Pending

---

### Task 6.3: Create CI/CD Pipelines

**Agent**: `devops-engineer`

**Description**:
Set up GitHub Actions for CI/CD.

**Detailed Requirements**:

1. Backend CI (build, test, Docker)
2. Frontend CI (build, test)
3. Deployment workflows
4. Branch protection

See original Task 12.3 for details.

**Status**: [ ] Pending

---

## Agent Reference

| Agent ID | Responsibilities |
|----------|------------------|
| `backend-developer` | .NET API, DDD implementation, EF Core, domain modeling, CQRS |
| `frontend-developer` | Angular apps, UI/UX, state management, API integration |
| `devops-engineer` | Docker, CI/CD, infrastructure, deployment |

---

## Notes for AI Agents

1. **Follow DDD principles strictly**:
   - Aggregates encapsulate business logic
   - Use value objects for type safety
   - Raise domain events for side effects
   - Repositories only for aggregate roots

2. **CQRS separation**:
   - Commands modify state, return Result
   - Queries read data, return DTOs
   - Never mix the two

3. **Layer dependencies**:
   - Domain has NO external dependencies
   - Application depends only on Domain
   - Infrastructure implements Domain/Application interfaces
   - API depends on all for DI setup only

4. **Strongly typed IDs everywhere** - Never use raw Guids in domain

5. **Result pattern for errors** - No exceptions for business rule violations

6. See `ARCHITECTURE-DDD.md` for visual diagrams

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-XX-XX | 1.0.0 | Initial task list |
| 2024-XX-XX | 2.0.0 | Restructured for DDD architecture |

