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

        // Resolve slugs (what presence tracks) to products for display. A slug with no matching
        // product (e.g. renamed since it was viewed) is simply dropped.
        var storeProducts = await _productRepository.GetByStoreIdAsync(storeId, ct);
        var bySlug = storeProducts
            .GroupBy(p => p.Slug.Value)
            .ToDictionary(g => g.Key, g => g.First());

        return rawCounts
            .Where(c => bySlug.ContainsKey(c.ProductSlug))
            .Select(c =>
            {
                var product = bySlug[c.ProductSlug];
                var image = product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
                return new LiveProductViewerDto(
                    product.Id.Value,
                    product.Name.Value,
                    product.Slug.Value,
                    image?.Url,
                    c.ViewerCount);
            })
            .ToList();
    }
}
