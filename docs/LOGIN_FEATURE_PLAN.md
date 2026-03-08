# Authentication & Authorization Overhaul — Implementation Plan

## Context
The current system has basic JWT auth (tokens in localStorage, no OTP, no cookie security, no roles on merchants, no store selection, limited profile fields). This plan upgrades both Merchant and StoreCustomer auth to:
- httpOnly cookies (XSS-safe) + CSRF tokens
- Two-step login (credentials → email OTP)
- Username OR email login
- Separate token TTL (Merchant: 15 min, Customer: 60 min)
- Merchant roles/permissions + multi-store assignment + store selection on login
- Rich customer profile: secondary phone, lat/lng on addresses, predefined countries/cities
- Profile pages (orders, addresses, personal data) in both apps

---

## Checklist — Implementation Phases

### PHASE 0 — Domain & Schema: PersonName + Username

- [ ] **0-1** Refactor `PersonName` value object (`src/Qaflety.Domain/Identity/ValueObjects/PersonName.cs`)
  - Split single `Value` string into `FirstName` + `LastName` properties
  - Keep computed `FullName` => `$"{FirstName} {LastName}"`
  - Update EF mapping accordingly

- [ ] **0-2** Add `Username` field to `Merchant` aggregate (`Identity/Aggregates/Merchant/Merchant.cs`)
  - New `Username` value object OR plain `string` with validation
  - Update `Merchant.Create()` factory + `UpdateProfile()` method

- [ ] **0-3** Add `Username` field to `StoreCustomer` aggregate (`Identity/Aggregates/StoreCustomer/StoreCustomer.cs`)
  - Same pattern as Merchant

- [ ] **0-4** Update `IMerchantRepository` + `IStoreCustomerRepository` to add:
  - `GetByUsernameAsync(username)`
  - `ExistsByUsernameAsync(username)`

- [ ] **0-5** Implement above in `MerchantRepository` + `StoreCustomerRepository`

- [ ] **0-6** Update `RegisterCommand` + `RegisterCommandHandler` → accept `FirstName`, `LastName`, `Username`
- [ ] **0-7** Update `RegisterStoreCustomerCommand` + handler → same

- [ ] **0-8** Migration: `AddUsernameAndSplitPersonName`

---

### PHASE 1 — Security: httpOnly Cookies + CSRF

- [ ] **1-1** Add `ITokenService` interface method overloads for per-role expiry:
  - `GenerateMerchantAccessToken(Merchant merchant)` → 15 min
  - `GenerateCustomerAccessToken(StoreCustomer customer)` → 60 min
  - Existing method already has per-role difference but uses the same config key — fix by adding `MerchantAccessTokenExpirationMinutes` (15) and `CustomerAccessTokenExpirationMinutes` (60) to `appsettings.json`

- [ ] **1-2** Update `Program.cs` — JWT `OnMessageReceived` event to read token from `access_token` httpOnly cookie (in addition to existing `access_token` query string for SignalR):
  ```csharp
  options.Events = new JwtBearerEvents
  {
      OnMessageReceived = context =>
      {
          // Existing: SignalR query string
          var accessToken = context.Request.Query["access_token"];
          if (!string.IsNullOrEmpty(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/hubs/chat"))
              context.Token = accessToken;

          // New: read from httpOnly cookie
          if (context.Token == null && context.Request.Cookies.TryGetValue("access_token", out var cookieToken))
              context.Token = cookieToken;

          return Task.CompletedTask;
      }
  };
  ```

- [ ] **1-3** Add ASP.NET Core Anti-Forgery in `Program.cs`:
  ```csharp
  builder.Services.AddAntiforgery(opts => {
      opts.HeaderName = "X-XSRF-TOKEN";
      opts.Cookie.Name = "XSRF-TOKEN";
      opts.Cookie.HttpOnly = false; // Angular reads this
      opts.Cookie.SameSite = SameSiteMode.Strict;
  });
  ```

- [ ] **1-4** Add CSRF middleware (after auth middleware) that validates `X-XSRF-TOKEN` header for mutating requests (POST/PUT/DELETE) — skip auth endpoints themselves

- [ ] **1-5** Create `ICookieAuthService` interface + `CookieAuthService` implementation:
  - `SetAuthCookies(HttpContext, accessToken, refreshToken, expiresAt)` — sets httpOnly `access_token` + `refresh_token` cookies
  - `ClearAuthCookies(HttpContext)` — clears both cookies
  - Cookie options: `HttpOnly=true`, `SameSite=Strict`, `Secure=true` (for prod), `Path=/`

- [ ] **1-6** Update `AuthController` → remove token from JSON response body, call `CookieAuthService.SetAuthCookies()` instead; return only merchant info (no tokens in body)
- [ ] **1-7** Update `StorefrontAuthController` → same pattern
- [ ] **1-8** Update `RefreshToken` command → read from cookie via `IHttpContextAccessor` rather than request body; set new cookies
- [ ] **1-9** Update `Logout` → clear cookies instead of accepting refresh token in body

- [ ] **1-10** Add XSRF token endpoint `GET /api/auth/csrf-token` → generates and returns the XSRF cookie (for initial page load)

- [ ] **1-11** Frontend (Merchant): Remove all `localStorage` token storage. Configure `HttpClient` with `withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })`. Auth interceptor: remove Bearer header injection (cookies are automatic). Keep error interceptor for 401 → call refresh endpoint.

- [ ] **1-12** Frontend (Store): Same changes as 1-11 for customer-auth.interceptor.

---

### PHASE 2 — Two-Step Login with Email OTP

#### Backend

- [ ] **2-1** Create `LoginOtp` entity in `src/Qaflety.Domain/Identity/Aggregates/LoginOtp/LoginOtp.cs`:
  - Fields: `Id`, `Email`, `Code` (6-digit), `Purpose` (enum: MerchantLogin, CustomerLogin), `CreatedAt`, `ExpiresAt` (10 min), `IsUsed`, `AttemptCount` (max 5)
  - Reuse `OrderOtp` pattern exactly

- [ ] **2-2** Create `ILoginOtpRepository` interface in `Domain/Identity/Repositories/`
- [ ] **2-3** Implement `LoginOtpRepository` in Infrastructure
- [ ] **2-4** Register in `DependencyInjection.cs`
- [ ] **2-5** Migration: `AddLoginOtp`

- [ ] **2-6** Replace `LoginCommand` with two commands:
  - `InitiateMerchantLoginCommand(EmailOrUsername, Password)` → validates credentials, generates OTP, emails it, returns `{ email }` (200)
  - `VerifyMerchantLoginOtpCommand(EmailOrUsername, OtpCode)` → validates OTP, generates tokens, sets cookies, returns `{ merchant, stores[] }`

- [ ] **2-7** Same for customer:
  - `InitiateCustomerLoginCommand(EmailOrUsername, Password)` → same flow
  - `VerifyCustomerLoginOtpCommand(EmailOrUsername, OtpCode)` → sets cookies, returns customer info

- [ ] **2-8** Update `AuthController` endpoints:
  - `POST /api/auth/login` → calls `InitiateMerchantLoginCommand`
  - `POST /api/auth/verify-otp` → calls `VerifyMerchantLoginOtpCommand`

- [ ] **2-9** Update `StorefrontAuthController` endpoints:
  - `POST /api/storefront/auth/login` → calls `InitiateCustomerLoginCommand`
  - `POST /api/storefront/auth/verify-otp` → calls `VerifyCustomerLoginOtpCommand`

- [ ] **2-10** Add OTP resend endpoints (with 60s cooldown, reuse `OrderOtp` pattern):
  - `POST /api/auth/resend-otp` + `POST /api/storefront/auth/resend-otp`

#### Frontend

- [ ] **2-11** Merchant login page: convert to 2-step form (step 1: email/username + password → step 2: OTP input with countdown timer + resend)
- [ ] **2-12** Store login page: same 2-step pattern

---

### PHASE 3 — Customer Profile Enhancements

#### Backend

- [ ] **3-1** Add `SecondaryPhone` (nullable) to `StoreCustomer` aggregate
- [ ] **3-2** Add `Latitude` (decimal?) and `Longitude` (decimal?) to `CustomerAddress` value object
- [ ] **3-3** Update `AddCustomerAddressCommand` + handler to accept `Latitude`, `Longitude`, `SecondaryPhone`
- [ ] **3-4** Update `CustomerAddressDto` + `AddressRequest` records
- [ ] **3-5** Migration: `AddCustomerSecondaryPhoneAndAddressCoordinates`

---

### PHASE 4 — Countries & Cities Reference Data

#### Backend

- [ ] **4-1** Create `Country` entity in `src/Qaflety.Domain/Catalog/Aggregates/Country/Country.cs`:
  - Fields: `Id` (int), `Name`, `Code` (ISO 3166-1 alpha-2), `IsActive`

- [ ] **4-2** Create `City` entity in `src/Qaflety.Domain/Catalog/Aggregates/City/City.cs`:
  - Fields: `Id` (int), `CountryId`, `Name`, `IsActive`

- [ ] **4-3** Add `ICountryRepository` + `ICityRepository` interfaces
- [ ] **4-4** Implement repositories + EF configurations
- [ ] **4-5** Seed data in `QaflatyDbContext.OnModelCreating`: seed Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman + their major cities
- [ ] **4-6** Expose endpoints (no auth needed):
  - `GET /api/storefront/locations/countries` → list active countries
  - `GET /api/storefront/locations/cities?countryId={id}` → list active cities for country

- [ ] **4-7** Migration: `AddCountriesAndCities`

#### Frontend

- [ ] **4-8** Store app: Replace free-text country/city fields in address form with dropdowns populated from the API
- [ ] **4-9** Store app: Add map (Leaflet + OpenStreetMap) to address form for picking location point (lat/lng)

---

### PHASE 5 — Merchant Roles, Permissions & Store Assignment

#### Backend Domain

- [ ] **5-1** Create `MerchantPermission` flags enum in `src/Qaflety.Domain/Identity/Enums/MerchantPermission.cs`:
  ```
  ViewProducts = 1, ManageProducts = 2,
  ViewOrders = 4, ManageOrders = 8,
  ViewCustomers = 16, ManageCustomers = 32,
  ManageStore = 64, ManageChat = 128,
  ManageMerchants = 256 (Owner only)
  ```

- [ ] **5-2** Create `MerchantRole` enum: `Owner = 0, Admin = 1, Manager = 2, Staff = 3`

- [ ] **5-3** Create static `RolePermissions` mapping class:
  - Owner → all permissions
  - Admin → all except ManageMerchants
  - Manager → ViewProducts, ManageProducts, ViewOrders, ManageOrders, ViewCustomers, ManageChat
  - Staff → ViewProducts, ViewOrders, ViewCustomers

- [ ] **5-4** Create `MerchantStoreAssignment` entity in `src/Qaflety.Domain/Identity/Aggregates/Merchant/MerchantStoreAssignment.cs`:
  - Fields: `MerchantId`, `StoreId`, `Role`, `IsActive`, `InvitedBy` (MerchantId), `CreatedAt`

- [ ] **5-5** Add `_storeAssignments` navigation to `Merchant` aggregate + methods:
  - `AssignToStore(StoreId, Role, MerchantId invitedBy)`
  - `RemoveFromStore(StoreId)`
  - `HasAccessToStore(StoreId)` → bool

- [ ] **5-6** Update `IMerchantRepository`:
  - `GetStoreAssignmentsAsync(MerchantId)` → list of accessible stores with roles
  - `GetAssignedMerchantsAsync(StoreId)` → list of merchants on a store

- [ ] **5-7** Migration: `AddMerchantStoreAssignments`

#### Backend Application

- [ ] **5-8** Update `VerifyMerchantLoginOtpCommand` response → include `stores[]` with `{ storeId, storeName, role }` after OTP verification

- [ ] **5-9** Add `SelectStoreCommand(StoreId)`:
  - Validates merchant has access to store
  - Generates new JWT with `store_id` + `role` + `permissions` claims
  - Sets new `access_token` cookie
  - Returns `{ storeId, role, permissions[] }`

- [ ] **5-10** Add commands for store assignment management:
  - `InviteMerchantToStoreCommand(StoreId, EmailOrUsername, Role)` → creates invitation + sends email
  - `RemoveMerchantFromStoreCommand(StoreId, MerchantId)` → removes assignment
  - `UpdateMerchantRoleCommand(StoreId, MerchantId, Role)` → changes role

- [ ] **5-11** Add query: `GetStoreMerchantsQuery(StoreId)` → list merchants on store with roles

#### Backend API

- [ ] **5-12** New controller `MerchantTeamController` (route `api/stores/{storeId}/team`):
  - `GET /` → GetStoreMerchantsQuery
  - `POST /invite` → InviteMerchantToStoreCommand
  - `DELETE /{merchantId}` → RemoveMerchantFromStoreCommand
  - `PUT /{merchantId}/role` → UpdateMerchantRoleCommand
  - All require `[Authorize(Policy = "AdminOrAbove")]`

- [ ] **5-13** `POST /api/auth/select-store` → SelectStoreCommand

- [ ] **5-14** Update `JwtTokenService`:
  - `GenerateMerchantAccessToken(Merchant, StoreId?, MerchantRole?)` → add `store_id`, `role`, `permissions` claims when store is selected
  - Update `ICurrentUserService` to expose `StoreId`, `Role`, `Permissions`

- [ ] **5-15** Update existing store-sensitive merchant endpoints to validate `store_id` from token matches requested store

- [ ] **5-16** Add authorization policies:
  - `"OwnerPolicy"` → role = Owner
  - `"AdminOrAbove"` → role ∈ {Owner, Admin}
  - `"ManagerOrAbove"` → role ∈ {Owner, Admin, Manager}
  - `"StaffOrAbove"` → any role (default for protected routes)

#### Frontend — Merchant App

- [ ] **5-17** After OTP verification → if user has multiple stores, show store selection screen; if only one, auto-select
- [ ] **5-18** Store selection component: list stores with role badges
- [ ] **5-19** Add Team Management page (`/stores/team`): list members, invite, change roles, remove
- [ ] **5-20** Role-based UI guards: hide navigation items based on `permissions` signal
- [ ] **5-21** Auth service: expose `role`, `permissions`, `storeId` from decoded JWT (using `jwtDecode`)

---

### PHASE 6 — Frontend: Merchant Profile & Registration

- [ ] **6-1** Update registration form: `FirstName` + `LastName` (separate fields) + `Username`
- [ ] **6-2** Profile page at `/profile`: show and edit first name, last name, username, phone, email
- [ ] **6-3** Change password form (already exists in backend)

---

### PHASE 7 — Frontend: Customer Store Profile

- [ ] **7-1** Update registration form: `FirstName`, `LastName`, `Username`, `Phone`, `SecondaryPhone`
- [ ] **7-2** Account pages already exist (`/account/profile`, `/account/addresses`):
  - Profile page: personal data with secondary phone field
  - Addresses page: list with default badge, add/edit/delete address
- [ ] **7-3** Address form: country dropdown → city dropdown (dynamic, filtered by country) + free-text street
- [ ] **7-4** Address form: Leaflet map (`ngx-leaflet` or vanilla Leaflet) for lat/lng selection
  - Click map → set marker → store `latitude`/`longitude`
  - Show existing saved coordinates on load
- [ ] **7-5** Orders page at `/account/orders`: list customer's orders with status and details
- [ ] **7-6** Logout: call `POST /api/storefront/auth/logout` (clears cookies server-side)

---

## Critical File Paths

### Backend — Files to Modify
| File | Change |
|------|--------|
| `src/Qaflety.Domain/Identity/ValueObjects/PersonName.cs` | Split into FirstName + LastName |
| `src/Qaflety.Domain/Identity/Aggregates/Merchant/Merchant.cs` | Add Username, FirstName/LastName |
| `src/Qaflety.Domain/Identity/Aggregates/StoreCustomer/StoreCustomer.cs` | Add Username, SecondaryPhone |
| `src/Qaflety.Domain/Identity/ValueObjects/CustomerAddress.cs` | Add Latitude, Longitude |
| `src/Qaflety.Infrastructure/Services/Identity/JwtTokenService.cs` | Cookie support, per-role expiry, store claims |
| `src/Qaflety.Api/Program.cs` | Cookie JWT read, antiforgery, policies |
| `src/Qaflety.Api/Controllers/AuthController.cs` | 2-step login, cookie response, select-store |
| `src/Qaflety.Api/Controllers/StorefrontAuthController.cs` | 2-step login, cookie response |
| `src/Qaflety.Api/Controllers/CustomerAddressesController.cs` | Add lat/lng fields |
| `src/Qaflety.Application/Identity/Services/ITokenService.cs` | New method signatures |

### Backend — New Files
| File | Purpose |
|------|---------|
| `Domain/Identity/Aggregates/LoginOtp/LoginOtp.cs` | OTP for login |
| `Domain/Identity/Repositories/ILoginOtpRepository.cs` | |
| `Domain/Identity/Aggregates/Merchant/MerchantStoreAssignment.cs` | Multi-store RBAC |
| `Domain/Identity/Enums/MerchantPermission.cs` | Permissions flags |
| `Domain/Identity/Enums/MerchantRole.cs` | Role enum |
| `Domain/Identity/Services/RolePermissions.cs` | Static role→permissions map |
| `Domain/Catalog/Aggregates/Country/Country.cs` | Country reference data |
| `Domain/Catalog/Aggregates/City/City.cs` | City reference data |
| `Application/Identity/Commands/InitiateMerchantLogin/` | Step 1 login |
| `Application/Identity/Commands/VerifyMerchantLoginOtp/` | Step 2 login |
| `Application/Identity/Commands/InitiateCustomerLogin/` | Step 1 customer login |
| `Application/Identity/Commands/VerifyCustomerLoginOtp/` | Step 2 customer login |
| `Application/Identity/Commands/SelectStore/` | Store selection |
| `Application/Identity/Commands/InviteMerchantToStore/` | Team management |
| `Api/Controllers/MerchantTeamController.cs` | Team CRUD |
| `Infrastructure/Services/Identity/CookieAuthService.cs` | Cookie helpers |
| `Infrastructure/Persistence/Repositories/LoginOtpRepository.cs` | |
| `Infrastructure/Persistence/Repositories/CountryRepository.cs` | |
| `Infrastructure/Persistence/Repositories/CityRepository.cs` | |

### Frontend — Files to Modify
| File | Change |
|------|--------|
| `merchant/src/app/core/services/auth.service.ts` | Remove localStorage, cookie-based, store/role signals |
| `merchant/src/app/core/interceptors/auth.interceptor.ts` | Remove Bearer header injection |
| `merchant/src/app/core/interceptors/error.interceptor.ts` | Refresh via cookie |
| `merchant/src/app/features/auth/login/login.component.ts` | 2-step login + OTP |
| `merchant/src/app/app.config.ts` | Add withXsrfConfiguration |
| `store/src/app/services/customer-auth.service.ts` | Cookie-based |
| `store/src/app/interceptors/customer-auth.interceptor.ts` | Remove Bearer header |
| `store/src/app/pages/account/login/login.component.ts` | 2-step login + OTP |
| `shared/src/lib/models/auth.models.ts` | Update DTOs |

---

## Existing Patterns to Reuse

- **OTP pattern**: `OrderOtp` entity → reuse exact structure for `LoginOtp`
- **Email sending**: `IEmailService.SendEmailAsync()` — `src/Qaflety.Application/Common/Interfaces/IEmailService.cs`
- **60s resend cooldown**: `StorefrontOrdersController.ResendOtp()` pattern
- **Value object pattern**: `CustomerAddress`, `PhoneNumber`, `Email` — all in `Domain/Common/ValueObjects/`
- **Result pattern**: all handlers → `Result<T>` — `Domain/Common/Errors/Result.cs`
- **Domain errors**: add to `Domain/Identity/Errors/IdentityErrors.cs`
- **CQRS handler registration**: automatic via `AddMediatR` — no manual registration

---

## Migrations Sequence
1. `AddUsernameAndSplitPersonName`
2. `AddLoginOtp`
3. `AddCustomerSecondaryPhoneAndAddressCoordinates`
4. `AddCountriesAndCities` (includes seeding)
5. `AddMerchantStoreAssignments`

---

## Verification & Testing

### Backend
```bash
dotnet build                        # Must compile clean
dotnet ef database update ...       # Apply all migrations
dotnet run --project src/Qaflety.Api  # Start API
```

**Test flows (manual / Swagger):**
1. `POST /api/auth/login` with email+password → should return 200 + set no token in body, email OTP sent
2. `POST /api/auth/verify-otp` with OTP → response sets `access_token` httpOnly cookie, returns merchant + stores[]
3. `POST /api/auth/select-store` → cookie updated with store_id+role
4. `GET /api/auth/me` with no `Authorization` header → cookie auth should work
5. `POST /api/auth/refresh` → new cookies set
6. `POST /api/auth/logout` → cookies cleared
7. Repeat flows 1-6 for customer (`/api/storefront/auth/...`)
8. `GET /api/storefront/locations/countries` → returns seeded countries
9. `GET /api/storefront/locations/cities?countryId=1` → returns cities

### Frontend
```bash
cd clients/qaflaty-workspace
npm run start:merchant   # port 4202
npm run start:store      # port 4201
```

**Test flows:**
1. Merchant: register (first/last/username) → login step 1 → OTP email → step 2 → store picker → dashboard
2. Merchant: profile page → edit personal data
3. Merchant: team page → invite → change role → remove
4. Customer: register → login step 1 → OTP → step 2 → account pages
5. Customer: add address with country/city dropdowns + map pin
6. Customer: view orders, view/edit profile, manage addresses

---

## Notes & Decisions
- Tokens are **never** returned in JSON response body — only set as httpOnly cookies
- CSRF token cookie `XSRF-TOKEN` is NOT httpOnly (Angular reads it) but IS `SameSite=Strict`
- SignalR chat still uses query string token (existing pattern kept for compatibility)
- Store customers are **per-store** (tied to `StoreId` via existing `StoreCustomer` model)
- `PersonName` split to FirstName+LastName is a breaking schema change — existing data migration needed (split on first space)
- Owner role is **auto-assigned** on store creation (existing `StoreCreatedEvent` handler)
- `MerchantStoreAssignment` is the source of truth for multi-store access, NOT the JWT claims (JWT is derived from it)
- Countries/Cities use int PKs for lookup (not Guid) to match common convention for reference data
