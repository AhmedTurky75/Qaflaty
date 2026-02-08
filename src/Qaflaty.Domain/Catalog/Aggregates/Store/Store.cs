using Qaflaty.Domain.Catalog.Aggregates.Store.Events;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Store;

public sealed class Store : AggregateRoot<StoreId>
{
    public MerchantId MerchantId { get; private set; }
    public StoreSlug Slug { get; private set; } = null!;
    public string? CustomDomain { get; private set; }
    public StoreName Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public StoreBranding Branding { get; private set; } = null!;
    public StoreStatus Status { get; private set; }
    public DeliverySettings DeliverySettings { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

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
}
