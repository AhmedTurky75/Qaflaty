# Qaflaty — Feature Implementation Plan

**Author:** Senior Engineer
**Date:** 2026-03-26
**Branch:** `claude/delete-address-feature-H6DVj`

---

## Task Checklist

- [x] Write this plan
- [ ] Feature 1 — Soft delete for customer addresses
- [ ] Feature 2 — OTP config on place order (store builder)
- [ ] Feature 3 — Phone number with country code (libphonenumber)
- [ ] Feature 4 — Payment method fee/discount in store builder
- [ ] Feature 5 — Delivery zones (countries / cities / districts)
- [ ] Feature 6 — Custom product properties
- [ ] Feature 7 — Product search criteria config
- [ ] Feature 8 — Store logos and icons

---

## Feature 1 — Soft Delete for Customer Addresses

### Problem
`StoreCustomer.RemoveAddress()` physically deletes rows from `customer_addresses`. This loses audit history and can break any order reference that stored an address label.

### Design
Add `IsDeleted` / `DeletedAt` to `CustomerAddress`. The aggregate filters deleted addresses from its public `Addresses` property. The DB row is retained.

### Changes

| Layer | File | Change |
|-------|------|--------|
| Domain | `CustomerAddress.cs` | Add `IsDeleted`, `DeletedAt`; add `SoftDelete()` method |
| Domain | `StoreCustomer.cs` | `RemoveAddress()` calls `SoftDelete()` instead of `_addresses.Remove()`; filter in `Addresses` property |
| Infrastructure | `StoreCustomerConfiguration.cs` | Map `is_deleted`, `deleted_at` columns |
| Infrastructure | Migrations | `AddSoftDeleteToCustomerAddress` |

### Key Code

```csharp
// CustomerAddress.cs
public bool IsDeleted { get; private set; }
public DateTime? DeletedAt { get; private set; }

public void SoftDelete()
{
    IsDeleted = true;
    DeletedAt = DateTime.UtcNow;
}

// StoreCustomer.cs — Addresses property filters deleted
public IReadOnlyList<CustomerAddress> Addresses =>
    _addresses.Where(a => !a.IsDeleted).ToList().AsReadOnly();

// StoreCustomer.RemoveAddress — soft-deletes instead of Remove()
public Result RemoveAddress(string label)
{
    var address = _addresses.FirstOrDefault(a => a.Label == label && !a.IsDeleted);
    if (address == null)
        return Result.Failure(new Error("CustomerAddress.NotFound", "Address not found"));

    address.SoftDelete();

    if (address.IsDefault)
    {
        var next = _addresses.FirstOrDefault(a => !a.IsDeleted);
        next?.SetAsDefault();
    }

    UpdatedAt = DateTime.UtcNow;
    return Result.Success();
}
```

---

## Feature 2 — OTP Verification Config on Place Order

### Problem
OTP at order placement is currently always required or always skipped. Merchants need to control this per-store.

### Design
Add `RequireOtpOnPlaceOrder` bool to the existing `CustomerAuthSettings` value object. Default = `false`. One new column, no new table.

### Changes

| Layer | File | Change |
|-------|------|--------|
| Domain | `CustomerAuthSettings.cs` | Add `RequireOtpOnPlaceOrder` property; update `Create()` and `CreateDefault()` |
| Infrastructure | `StoreConfigurationEntityConfiguration.cs` | Map `auth_require_otp_on_place_order` column |
| Infrastructure | Migrations | `AddRequireOtpOnPlaceOrder` |
| Application | `UpdateStoreConfigurationCommand.cs` + DTO | Add field |
| Application | `PlaceOrderCommandHandler.cs` | Read config; skip OTP when `false` |

---

## Feature 3 — Phone Number with Country Code

### Package
**`libphonenumber-csharp`** (NuGet) — C# port of Google's libphonenumber. Validates, parses, and formats numbers in E.164 format (`+CountryCode + LocalNumber`).

### Design
- `PhoneNumber` value object: add `CountryCode` (ISO 3166-1 alpha-2, e.g. `"EG"`, `"SA"`) alongside the existing `Value` (stored as full E.164 string).
- Validation uses `PhoneNumberUtil.GetInstance().Parse(phone, countryCode)`.
- All commands that accept a phone number now require `countryCode` parameter.

### Changes

| Layer | File | Change |
|-------|------|--------|
| Domain | `Qaflaty.Domain.csproj` | Add `libphonenumber-csharp` NuGet |
| Domain | `PhoneNumber.cs` | Add `CountryCode`; validate via `PhoneNumberUtil`; expose `E164` computed property |
| Infrastructure | `StoreCustomerConfiguration.cs`, `MerchantConfiguration.cs` | Map `phone_country_code` (nullable varchar(2)) |
| Infrastructure | Migrations | `AddCountryCodeToPhoneNumbers` |
| Application | All commands accepting phone | Add `CountryCode` parameter |

### Key Code

```csharp
public static Result<PhoneNumber> Create(string phone, string countryCode)
{
    var util = PhoneNumberUtil.GetInstance();
    try
    {
        var parsed = util.Parse(phone, countryCode.ToUpper());
        if (!util.IsValidNumber(parsed))
            return Result.Failure<PhoneNumber>(
                new Error("PhoneNumber.Invalid", "Phone number is invalid for the selected country"));

        return Result.Success(new PhoneNumber
        {
            CountryCode = countryCode.ToUpper(),
            Value = util.Format(parsed, PhoneNumberFormat.E164) // e.g. +201012345678
        });
    }
    catch
    {
        return Result.Failure<PhoneNumber>(
            new Error("PhoneNumber.ParseError", "Could not parse the phone number"));
    }
}
```

---

## Feature 4 — Payment Method Fee / Discount

### Problem
Merchants want to incentivize or discourage specific payment methods (e.g. COD +20 SAR flat, Visa -5%).

### Design
- New value-object collection `PaymentMethodAdjustment` owned by `StoreConfiguration`.
- Each entry: `PaymentMethod` enum, `AdjustmentType` (Fixed | Percentage), `Value` (decimal, negative = discount, positive = surcharge), `DisplayLabel`.
- At order placement, the handler resolves the adjustment and adds it to `OrderPricing`.

### New Files

```
Domain/Catalog/ValueObjects/PaymentMethodAdjustment.cs
Domain/Catalog/Enums/PaymentMethodOption.cs   (COD, Visa, Mastercard, Mada, ApplePay, STCPay)
Domain/Catalog/Enums/FeeAdjustmentType.cs     (Fixed, Percentage)
```

### Changes

| Layer | File | Change |
|-------|------|--------|
| Domain | `StoreConfiguration.cs` | Add `IReadOnlyList<PaymentMethodAdjustment>`; `SetPaymentAdjustments()` |
| Domain | `PaymentMethodAdjustment.cs` | New value object |
| Domain | `PaymentMethodOption.cs`, `FeeAdjustmentType.cs` | New enums |
| Infrastructure | `StoreConfigurationEntityConfiguration.cs` | `OwnsMany` → `payment_method_adjustments` table |
| Infrastructure | Migrations | `AddPaymentMethodAdjustments` |
| Application | `UpdateStoreConfigurationCommand.cs` | Add `PaymentAdjustments` list |
| Application | `PlaceOrderCommandHandler.cs` | Apply adjustment to pricing |
| Application | `PaymentMethodAdjustmentDto.cs` | New DTO |

---

## Feature 5 — Delivery Zones (Countries / Cities / Districts)

### Package
**`Countries.NET`** (NuGet) — provides ISO 3166 country/region data. For cities and districts we extend the existing seeded `countries` / `cities` tables with a new `districts` table.

### Design
- New entity `District` (linked to `City`).
- New aggregate `DeliveryZone` per store. Hierarchy levels: `Country → City → District`.
- Each zone node: `IsDeliveryEnabled` (bool), `CustomDeliveryFee` (nullable Money).
- Zone resolution at order placement: district overrides city → city overrides country → fall back to store default `DeliverySettings.DeliveryFee`. If any matched zone has `IsDeliveryEnabled = false`, reject the order.

### New Files

```
Domain/Catalog/Aggregates/DeliveryZone/DeliveryZone.cs
Domain/Catalog/Aggregates/DeliveryZone/DeliveryZoneNode.cs
Domain/Catalog/Enums/DeliveryZoneLevel.cs
Domain/Catalog/Repositories/IDeliveryZoneRepository.cs
Infrastructure/Persistence/Configurations/Catalog/DistrictConfiguration.cs
Infrastructure/Persistence/Configurations/Catalog/DeliveryZoneConfiguration.cs
Infrastructure/Persistence/Repositories/DeliveryZoneRepository.cs
Application/Catalog/Commands/SetDeliveryZones/
Application/Catalog/Queries/GetDeliveryZones/
Application/Catalog/Queries/GetDeliveryFeeForAddress/
Api/Controllers/DeliveryZonesController.cs
```

### DB Schema

```sql
districts
  id, city_id, name, name_ar

delivery_zones
  id, store_id, level (Country|City|District),
  reference_id,          -- country_id / city_id / district_id
  is_delivery_enabled,
  custom_delivery_fee,   -- nullable decimal
  currency               -- varchar(3)
```

---

## Feature 6 — Custom Product Properties

### Problem
Every store has different product attributes (clothing: Material, Fit; electronics: Voltage, Wattage). Hard-coded fields can't cover all cases.

### Design
- `ProductPropertyDefinition` — store-level template. Merchant defines properties once per store.
- `ProductPropertyValue` — per-product values referencing a definition.
- Types: `Text`, `Number`, `Boolean`, `SingleChoice`, `MultiChoice`.
- `IsFilterable` flag drives Feature 7.

### New Files

```
Domain/Catalog/Aggregates/Product/ProductPropertyDefinition.cs
Domain/Catalog/Aggregates/Product/ProductPropertyValue.cs
Domain/Catalog/Enums/ProductPropertyType.cs
Domain/Catalog/Repositories/IProductPropertyDefinitionRepository.cs
Infrastructure/.../Catalog/ProductPropertyDefinitionConfiguration.cs
Infrastructure/.../Catalog/ProductPropertyValueConfiguration.cs
Application/Catalog/Commands/CreateProductPropertyDefinition/
Application/Catalog/Commands/UpdateProductPropertyDefinition/
Application/Catalog/Commands/DeleteProductPropertyDefinition/
Application/Catalog/Commands/SetProductPropertyValues/
Application/Catalog/Queries/GetProductPropertyDefinitions/
Application/Catalog/DTOs/ProductPropertyDto.cs
Api/Controllers/ProductPropertiesController.cs
```

### Key Domain Models

```csharp
// ProductPropertyDefinition (store-level template)
public class ProductPropertyDefinition : Entity<ProductPropertyDefinitionId>
{
    public StoreId StoreId;
    public string Name;           // internal key, e.g. "material"
    public string DisplayName;    // shown to customers, e.g. "Material"
    public ProductPropertyType Type;
    public List<string> Options;  // only for SingleChoice / MultiChoice
    public bool IsRequired;
    public bool IsFilterable;
    public int SortOrder;
}

// ProductPropertyValue (per product)
public class ProductPropertyValue : Entity<Guid>
{
    public ProductId ProductId;
    public ProductPropertyDefinitionId DefinitionId;
    public string Value;          // stored as string; app layer parses per Type
}

public enum ProductPropertyType { Text, Number, Boolean, SingleChoice, MultiChoice }
```

### Product Aggregate Changes
- `Product.cs`: add `_propertyValues` list; `SetPropertyValues()` method.
- `ProductConfiguration.cs`: map `product_property_values` table.

---

## Feature 7 — Product Search Criteria Config

### Problem
Each store needs different search/filter options. A bookstore wants Author filter; a fashion store wants Size + Color filters.

### Design
- New owned value object `SearchSettings` on `StoreConfiguration`.
- Merchant enables/disables: text search, price filter, category filter, and selects which custom property definitions appear as filters in the storefront.
- The storefront `GetProducts` query already accepts filter parameters — extend it to enforce the store's search settings.

### New Files / Changes

```
Domain/Catalog/ValueObjects/SearchSettings.cs
Infrastructure/.../StoreConfigurationEntityConfiguration.cs  (map columns)
Application/Catalog/Queries/GetProducts/GetProductsQuery.cs  (add filter params)
Application/Catalog/DTOs/SearchSettingsDto.cs
```

### SearchSettings Model

```csharp
public class SearchSettings : ValueObject
{
    public bool EnableTextSearch { get; }
    public bool EnableCategoryFilter { get; }
    public bool EnablePriceFilter { get; }
    public bool EnablePropertyFilters { get; }
    public List<Guid> FilterablePropertyDefinitionIds { get; }
    public List<ProductSortOption> AllowedSortOptions { get; }
}

public enum ProductSortOption
{
    PriceAsc, PriceDesc, NameAsc, NameDesc, Newest, BestSelling
}
```

---

## Feature 8 — Store Logos and Icons

### Problem
`StoreBranding` only stores `LogoUrl` and `PrimaryColor`. Modern storefronts need favicon, Apple touch icon, and Open Graph image for social sharing.

### Design
Extend `StoreBranding` value object with additional URL fields. Map new nullable columns.

### Changes

| Layer | File | Change |
|-------|------|--------|
| Domain | `StoreBranding.cs` | Add `FaviconUrl`, `AppleTouchIconUrl`, `OgImageUrl`, `SecondaryLogoUrl`, `SecondaryColor` |
| Infrastructure | Store branding configuration | Map new nullable columns |
| Infrastructure | Migrations | `AddBrandingIconFields` |
| Application | `UpdateStoreBrandingCommand.cs` | Accept new fields |
| Application | `StoreBrandingDto.cs` | Expose new fields |

### Extended StoreBranding

```csharp
public sealed class StoreBranding : ValueObject
{
    public string? LogoUrl { get; }
    public string? SecondaryLogoUrl { get; }   // dark-mode / alternate logo
    public string? FaviconUrl { get; }
    public string? AppleTouchIconUrl { get; }
    public string? OgImageUrl { get; }          // Open Graph / social share image
    public string PrimaryColor { get; }
    public string? SecondaryColor { get; }
}
```

---

## Migration Summary

| Migration Name | Feature |
|----------------|---------|
| `AddSoftDeleteToCustomerAddress` | 1 |
| `AddRequireOtpOnPlaceOrder` | 2 |
| `AddCountryCodeToPhoneNumbers` | 3 |
| `AddPaymentMethodAdjustments` | 4 |
| `AddDeliveryZones` | 5 |
| `AddProductPropertyDefinitions` | 6 |
| `AddSearchSettingsToStoreConfig` | 7 |
| `AddBrandingIconFields` | 8 |

---

## NuGet Packages to Add

| Package | Project | Feature |
|---------|---------|---------|
| `libphonenumber-csharp` | `Qaflaty.Domain` | 3 |
| `Countries.NET` | `Qaflaty.Infrastructure` | 5 |

---

## Implementation Order (lowest risk first)

1. Feature 1 — isolated domain change, no new table
2. Feature 8 — extend existing value object, no new aggregate
3. Feature 2 — one bool added to existing value object
4. Feature 3 — NuGet + refactor, careful regression testing
5. Feature 4 — new owned collection, order pricing integration
6. Feature 5 — largest scope; new aggregate, repository, zone resolution
7. Feature 6 — new aggregate, property value storage
8. Feature 7 — depends on Feature 6 filterable properties
