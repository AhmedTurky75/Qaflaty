using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.UnitTests.Application.Handlers;

/// <summary>
/// Hand-written in-memory <see cref="IProductRepository"/> for handler tests (no mocking library,
/// matching the existing fake-based test style). Tracks whether Update was called.
/// </summary>
internal sealed class InMemoryProductRepository : IProductRepository
{
    private readonly Dictionary<ProductId, Product> _store = new();

    public int UpdateCallCount { get; private set; }
    public Product? LastUpdated { get; private set; }

    public InMemoryProductRepository(params Product[] seed)
    {
        foreach (var p in seed)
            _store[p.Id] = p;
    }

    public Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct = default)
        => Task.FromResult(_store.GetValueOrDefault(id));

    public void Update(Product product)
    {
        UpdateCallCount++;
        LastUpdated = product;
        _store[product.Id] = product;
    }

    public Task AddAsync(Product product, CancellationToken ct = default)
    {
        _store[product.Id] = product;
        return Task.CompletedTask;
    }

    // Unused by the handlers under test.
    public Task<Product?> GetByIdWithPropertyValuesAsync(ProductId id, CancellationToken ct = default)
        => Task.FromResult(_store.GetValueOrDefault(id));
    public Task<Product?> GetBySlugAsync(StoreId storeId, ProductSlug slug, CancellationToken ct = default)
        => throw new NotSupportedException();
    public Task<IReadOnlyList<Product>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => throw new NotSupportedException();
    public Task<IReadOnlyList<Product>> GetByStoreIdWithPropertyValuesAsync(StoreId storeId, CancellationToken ct = default)
        => throw new NotSupportedException();
    public Task<bool> IsSlugAvailableAsync(StoreId storeId, ProductSlug slug, ProductId? excludeId = null, CancellationToken ct = default)
        => throw new NotSupportedException();
    public void Delete(Product product) => throw new NotSupportedException();
}
