using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Analytics;

public class ProductViewerEnricher : IProductViewerEnricher
{
    private readonly IProductRepository _productRepository;

    public ProductViewerEnricher(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<List<LiveProductViewerDto>> EnrichAsync(
        StoreId storeId, IReadOnlyList<ProductViewerCountDto> rawCounts, CancellationToken ct = default)
    {
        if (rawCounts.Count == 0)
            return [];

        // Scope to this store's products — same enrichment pattern as GetMostWishlistedQueryHandler.
        var storeProducts = await _productRepository.GetByStoreIdAsync(storeId, ct);
        var byId = storeProducts.ToDictionary(p => p.Id.Value);

        return rawCounts
            .Where(c => byId.ContainsKey(c.ProductId))
            .Select(c =>
            {
                var product = byId[c.ProductId];
                var image = product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
                return new LiveProductViewerDto(
                    c.ProductId,
                    product.Name.Value,
                    product.Slug.Value,
                    image?.Url,
                    c.ViewerCount);
            })
            .ToList();
    }
}
