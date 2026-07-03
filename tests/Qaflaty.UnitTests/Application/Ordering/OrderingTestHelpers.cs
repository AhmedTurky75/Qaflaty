using Qaflaty.Domain.Catalog.Aggregates.DeliveryZone;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.UnitTests.Application.Ordering;

/// <summary>Builders for the aggregates the ordering handlers depend on.</summary>
internal static class OrderingTestHelpers
{
    public static Money M(decimal amount) => Money.Create(amount).Value;

    public static Store CreateStore(decimal deliveryFee = 25m, string currency = "EGP")
        => Store.Create(
            MerchantId.New(),
            StoreSlug.Create("test-store").Value,
            StoreName.Create("Test Store").Value,
            StoreBranding.Create().Value,
            DeliverySettings.Create(M(deliveryFee)).Value,
            Currency.FromCode(currency)).Value;

    /// <summary>An Active product owned by the given store, priced at <paramref name="price"/>.</summary>
    public static Product CreateProduct(StoreId storeId, decimal price = 100m, string slug = "prod")
    {
        var product = Product.Create(
            storeId,
            ProductName.Create("Product").Value,
            ProductSlug.Create(slug).Value,
            ProductPricing.Create(M(price)).Value,
            ProductInventory.Create(1000).Value).Value;
        product.Activate();
        return product;
    }

    /// <summary>Adds a single variant with a price override; returns its id.</summary>
    public static Guid AddVariant(Product product, decimal priceOverride, string sku = "SKU-V", int stock = 100)
    {
        product.AddVariantOption(VariantOption.Create("Color", ["Red"]).Value);
        var variant = ProductVariant.Create(
            product.Id,
            new Dictionary<string, string> { ["Color"] = "Red" },
            sku,
            M(priceOverride),
            stock,
            allowBackorder: false).Value;
        product.AddVariant(variant);
        return variant.Id;
    }

    public static StoreConfiguration ConfigWith(
        StoreId storeId,
        PaymentMethodAdjustment[]? adjustments = null,
        TaxSettings? tax = null,
        bool requireOtpOnPlaceOrder = false)
    {
        var config = StoreConfiguration.CreateDefault(storeId).Value;
        if (adjustments != null)
            config.SetPaymentMethodAdjustments(adjustments);
        if (tax != null)
            config.UpdateTaxSettings(tax);
        if (requireOtpOnPlaceOrder)
            config.UpdateCustomerAuthSettings(
                CustomerAuthSettings.Create(CustomerAuthMode.GuestOnly, true, false, requireOtpOnPlaceOrder: true));
        return config;
    }

    public static PaymentMethodAdjustment Adjustment(
        string key, FeeAdjustmentType type, decimal value, string? label = null, bool enabled = true)
        => PaymentMethodAdjustment.Create(key, type, value, label, enabled).Value;
}

// ---------- Shared fakes ----------

internal sealed class FakeStoreRepository : IStoreRepository
{
    private readonly Dictionary<StoreId, Store> _store = new();
    public FakeStoreRepository(params Store[] stores)
    {
        foreach (var s in stores) _store[s.Id] = s;
    }

    public Task<Store?> GetByIdAsync(StoreId id, CancellationToken ct = default)
        => Task.FromResult(_store.GetValueOrDefault(id));

    public Task<Store?> GetBySlugAsync(StoreSlug slug, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<Store?> GetByCustomDomainAsync(string domain, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<IReadOnlyList<Store>> GetByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<IReadOnlyList<Store>> GetAccessibleByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<bool> CanMerchantAccessStoreAsync(MerchantId merchantId, StoreId storeId, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<bool> IsSlugAvailableAsync(StoreSlug slug, StoreId? excludeId = null, CancellationToken ct = default) => throw new NotSupportedException();
    public Task AddAsync(Store store, CancellationToken ct = default) => throw new NotSupportedException();
    public void Update(Store store) { }
    public void Delete(Store store) => throw new NotSupportedException();
}

internal sealed class FakeStoreConfigRepository : IStoreConfigurationRepository
{
    private readonly StoreConfiguration? _config;
    public FakeStoreConfigRepository(StoreConfiguration? config = null) => _config = config;

    public Task<StoreConfiguration?> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => Task.FromResult(_config);

    public Task<StoreConfiguration?> GetByIdAsync(StoreConfigurationId id, CancellationToken ct = default) => throw new NotSupportedException();
    public Task AddAsync(StoreConfiguration config, CancellationToken ct = default) => throw new NotSupportedException();
    public void Update(StoreConfiguration config) { }
}

/// <summary>Returns configured zones keyed by (level, referenceId); null when not present → falls back to store default fee.</summary>
internal sealed class FakeDeliveryZoneRepository : IDeliveryZoneRepository
{
    private readonly Dictionary<(DeliveryZoneLevel, int), DeliveryZone> _zones = new();

    public void SetZone(DeliveryZoneLevel level, int referenceId, DeliveryZone zone)
        => _zones[(level, referenceId)] = zone;

    public Task<DeliveryZone?> GetZoneAsync(StoreId storeId, DeliveryZoneLevel level, int referenceId, CancellationToken ct = default)
        => Task.FromResult(_zones.GetValueOrDefault((level, referenceId)));

    public Task<DeliveryZone?> GetByIdAsync(DeliveryZoneId id, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<IReadOnlyList<DeliveryZone>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default) => throw new NotSupportedException();
    public Task AddAsync(DeliveryZone zone, CancellationToken ct = default) => throw new NotSupportedException();
    public void Update(DeliveryZone zone) { }
    public void Delete(DeliveryZone zone) => throw new NotSupportedException();
}
