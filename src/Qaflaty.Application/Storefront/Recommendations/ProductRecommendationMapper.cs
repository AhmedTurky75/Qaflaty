using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations;

internal static class ProductRecommendationMapper
{
    public static ProductPublicDto Map(Product p) => new(
        p.Id.Value,
        p.Slug.Value,
        p.Name.Value,
        p.Name.Arabic,
        p.Description,
        p.Pricing.Price.Amount,
        p.Pricing.CompareAtPrice?.Amount,
        p.Inventory.InStock,
        p.Images
            .OrderBy(i => i.SortOrder)
            .Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.SortOrder))
            .ToList());
}
