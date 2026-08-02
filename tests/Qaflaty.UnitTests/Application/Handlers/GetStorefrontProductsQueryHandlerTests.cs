using Qaflaty.Application.Catalog.Queries.GetStorefrontProducts;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Application.Handlers;

/// <summary>
/// Covers the storefront product feed, in particular the hand-picked selection
/// that page-builder sections use to show specific products in a chosen order.
/// </summary>
public class GetStorefrontProductsQueryHandlerTests
{
    private const string StoreSlugValue = "test-store";

    private static Store CreateStore()
        => Store.Create(
            MerchantId.New(),
            StoreSlug.Create(StoreSlugValue).Value,
            StoreName.Create("Test Store").Value,
            StoreBranding.Create().Value,
            DeliverySettings.Create(Money.Create(25m).Value).Value,
            Currency.FromCode("EGP")).Value;

    private static Product ActiveProduct(StoreId storeId, string slug, decimal price = 100m)
    {
        var product = Product.Create(
            storeId,
            ProductName.Create($"Product {slug}").Value,
            ProductSlug.Create(slug).Value,
            ProductPricing.Create(Money.Create(price).Value).Value,
            ProductInventory.Create(10).Value).Value;
        product.Activate();
        return product;
    }

    private static GetStorefrontProductsQueryHandler HandlerFor(Store store, params Product[] products)
        => new(new FakeStoreRepository(store), new FakeProductRepository(products));

    [Fact]
    public async Task Handle_WithSlugs_ReturnsOnlyThoseProductsInTheGivenOrder()
    {
        var store = CreateStore();
        var handler = HandlerFor(
            store,
            ActiveProduct(store.Id, "alpha"),
            ActiveProduct(store.Id, "beta"),
            ActiveProduct(store.Id, "gamma"));

        var result = await handler.Handle(
            new GetStorefrontProductsQuery(StoreSlugValue, CategoryId: null, Slugs: new List<string> { "gamma", "alpha" }),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(new[] { "gamma", "alpha" }, result.Value.Items.Select(p => p.Slug).ToArray());
    }

    [Fact]
    public async Task Handle_WithSlugs_IgnoresSlugsThatNoLongerExist()
    {
        var store = CreateStore();
        var handler = HandlerFor(store, ActiveProduct(store.Id, "alpha"));

        var result = await handler.Handle(
            new GetStorefrontProductsQuery(StoreSlugValue, CategoryId: null, Slugs: new List<string> { "deleted", "alpha" }),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(new[] { "alpha" }, result.Value.Items.Select(p => p.Slug).ToArray());
    }

    [Fact]
    public async Task Handle_WithDuplicateSlugs_DoesNotThrow()
    {
        var store = CreateStore();
        var handler = HandlerFor(store, ActiveProduct(store.Id, "alpha"), ActiveProduct(store.Id, "beta"));

        var result = await handler.Handle(
            new GetStorefrontProductsQuery(StoreSlugValue, CategoryId: null, Slugs: new List<string> { "alpha", "alpha", "beta" }),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(new[] { "alpha", "beta" }, result.Value.Items.Select(p => p.Slug).ToArray());
    }

    [Fact]
    public async Task Handle_WithoutSlugs_KeepsTheExistingNewestFirstBehaviour()
    {
        var store = CreateStore();
        var handler = HandlerFor(store, ActiveProduct(store.Id, "alpha"), ActiveProduct(store.Id, "beta"));

        var result = await handler.Handle(
            new GetStorefrontProductsQuery(StoreSlugValue, CategoryId: null),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Items.Count);
    }

    private sealed class FakeStoreRepository : IStoreRepository
    {
        private readonly Store _store;

        public FakeStoreRepository(Store store) => _store = store;

        public Task<Store?> GetBySlugAsync(StoreSlug slug, CancellationToken ct = default)
            => Task.FromResult(slug.Value == _store.Slug.Value ? _store : null);

        public Task<Store?> GetByIdAsync(StoreId id, CancellationToken ct = default)
            => Task.FromResult(id == _store.Id ? _store : null);

        // Unused by the handler under test.
        public Task<Store?> GetByCustomDomainAsync(string domain, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<IReadOnlyList<Store>> GetByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<IReadOnlyList<Store>> GetAccessibleByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<bool> CanMerchantAccessStoreAsync(MerchantId merchantId, StoreId storeId, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<bool> IsSlugAvailableAsync(StoreSlug slug, StoreId? excludeId = null, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task AddAsync(Store store, CancellationToken ct = default) => throw new NotSupportedException();
        public void Update(Store store) => throw new NotSupportedException();
        public void Delete(Store store) => throw new NotSupportedException();
    }

    private sealed class FakeProductRepository : IProductRepository
    {
        private readonly IReadOnlyList<Product> _products;

        public FakeProductRepository(IReadOnlyList<Product> products) => _products = products;

        public Task<IReadOnlyList<Product>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
            => Task.FromResult(_products);

        public Task<IReadOnlyList<Product>> GetByStoreIdWithPropertyValuesAsync(StoreId storeId, CancellationToken ct = default)
            => Task.FromResult(_products);

        // Unused by the handler under test.
        public Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<Product?> GetByIdWithPropertyValuesAsync(ProductId id, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<Product?> GetBySlugAsync(StoreId storeId, ProductSlug slug, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<IReadOnlyList<Product>> GetByStoreIdWithVariantsAsync(StoreId storeId, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task<bool> IsSlugAvailableAsync(StoreId storeId, ProductSlug slug, ProductId? excludeId = null, CancellationToken ct = default)
            => throw new NotSupportedException();
        public Task AddAsync(Product product, CancellationToken ct = default) => throw new NotSupportedException();
        public void Update(Product product) => throw new NotSupportedException();
        public void Delete(Product product) => throw new NotSupportedException();
    }
}
