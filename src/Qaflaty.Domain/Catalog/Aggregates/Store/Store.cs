using Qaflaty.Domain.Catalog.Aggregates.Store.Events;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Store;

public sealed class Store : AggregateRoot<StoreId>
{
    public MerchantId MerchantId { get; private set; } // Owner merchant of this store (the seller account that created it)
    public StoreSlug Slug { get; private set; } = null!; // Unique URL slug used to resolve the tenant via X-Store-Slug header, e.g. "my-shop" → my-shop.qaflaty.com
    public string? CustomDomain { get; private set; } // Optional custom domain mapped to the store, resolved via X-Custom-Domain header, e.g. "www.brand.com"
    public StoreName Name { get; private set; } = null!; // Display name of the store shown to customers, e.g. "Qaflaty Boutique"
    public string? Description { get; private set; } // Optional short description / tagline of the store
    public StoreBranding Branding { get; private set; } = null!; // Visual identity value object: logo URL, primary/secondary colors, theme settings
    public StoreStatus Status { get; private set; } // Store lifecycle state: Active / Inactive / Maintenance — controls storefront availability
    public DeliverySettings DeliverySettings { get; private set; } = null!; // Default delivery configuration: flat fee, free-shipping threshold, estimated days
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the store was created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last store modification

    private Store() : base(StoreId.Empty) { }

    public static Result<Store> Create(
        MerchantId merchantId,
        StoreSlug slug,
        StoreName name,
        StoreBranding branding,
        DeliverySettings deliverySettings)
    {
        var store = new Store
        {
            Id = StoreId.New(),
            MerchantId = merchantId,
            Slug = slug,
            Name = name,
            Branding = branding,
            Status = StoreStatus.Active,
            DeliverySettings = deliverySettings,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        store.RaiseDomainEvent(new StoreCreatedEvent(store.Id, merchantId));

        return Result.Success(store);
    }

    public Result UpdateInfo(StoreName name, string? description)
    {
        Name = name;
        Description = description;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new StoreUpdatedEvent(Id));
        return Result.Success();
    }

    public Result UpdateBranding(StoreBranding branding)
    {
        Branding = branding;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new StoreUpdatedEvent(Id));
        return Result.Success();
    }

    public Result UpdateDeliverySettings(DeliverySettings settings)
    {
        DeliverySettings = settings;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new StoreUpdatedEvent(Id));
        return Result.Success();
    }

    public Result SetCustomDomain(string? domain)
    {
        CustomDomain = domain;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new StoreUpdatedEvent(Id));
        return Result.Success();
    }

    public Result Activate()
    {
        Status = StoreStatus.Active;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new StoreUpdatedEvent(Id));
        return Result.Success();
    }

    public Result Deactivate()
    {
        Status = StoreStatus.Inactive;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new StoreUpdatedEvent(Id));
        return Result.Success();
    }

    public Result SetMaintenance(bool enabled)
    {
        Status = enabled ? StoreStatus.Maintenance : StoreStatus.Active;
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new StoreUpdatedEvent(Id));
        return Result.Success();
    }
}
