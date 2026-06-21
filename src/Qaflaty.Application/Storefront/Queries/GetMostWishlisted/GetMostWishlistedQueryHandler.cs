using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetMostWishlisted;

public class GetMostWishlistedQueryHandler
    : IQueryHandler<GetMostWishlistedQuery, IReadOnlyList<MostWishlistedProductDto>>
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly IProductRepository _productRepository;

    public GetMostWishlistedQueryHandler(
        IWishlistRepository wishlistRepository,
        IProductRepository productRepository)
    {
        _wishlistRepository = wishlistRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<MostWishlistedProductDto>>> Handle(
        GetMostWishlistedQuery request, CancellationToken ct)
    {
        var counts = await _wishlistRepository.GetWishlistCountsByProductAsync(ct);
        if (counts.Count == 0)
            return Result.Success<IReadOnlyList<MostWishlistedProductDto>>([]);

        // Scope to this store's products and order by wishlist count.
        var storeProducts = await _productRepository.GetByStoreIdAsync(request.StoreId, ct);
        var byId = storeProducts.ToDictionary(p => p.Id.Value);

        var result = counts
            .Where(c => byId.ContainsKey(c.ProductId))
            .OrderByDescending(c => c.Count)
            .Take(request.Take)
            .Select(c =>
            {
                var p = byId[c.ProductId];
                var image = p.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
                return new MostWishlistedProductDto(
                    c.ProductId,
                    p.Name.Value,
                    p.Slug.Value,
                    c.Count,
                    image?.Url);
            })
            .ToList();

        return Result.Success<IReadOnlyList<MostWishlistedProductDto>>(result);
    }
}
