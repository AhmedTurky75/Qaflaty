using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Application.Storefront.Recommendations.CrossSell;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.GetCartCrossSell;

/// <summary>
/// Cart-page cross-sell: complements for everything currently in the cart, scored by how many
/// distinct cart lines recommend each candidate (prioritizing products that complement multiple
/// items), excluding anything already in the cart.
/// </summary>
public class GetCartCrossSellQueryHandler : IQueryHandler<GetCartCrossSellQuery, IReadOnlyList<ProductPublicDto>>
{
    /// <summary>Bounds fan-out cost on carts with many distinct products.</summary>
    private const int MaxCartLinesConsidered = 10;

    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IStoreConfigurationRepository _storeConfigRepository;
    private readonly ICrossSellRecommendationService _recommendationService;

    public GetCartCrossSellQueryHandler(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IStoreConfigurationRepository storeConfigRepository,
        ICrossSellRecommendationService recommendationService)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _storeConfigRepository = storeConfigRepository;
        _recommendationService = recommendationService;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetCartCrossSellQuery request, CancellationToken ct)
    {
        var cart = await CartOwnerResolver.ResolveExistingCartAsync(request.Owner, _cartRepository, ct);
        if (cart is null || cart.Items.Count == 0 || cart.StoreId is null)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var storeId = cart.StoreId.Value;
        var config = await _storeConfigRepository.GetByStoreIdAsync(storeId, ct);
        if (config is not null && !config.CrossSellEnabled)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var take = config is { CrossSellLimit: > 0 } ? Math.Min(request.Take, config.CrossSellLimit) : request.Take;
        var excludeOutOfStock = config?.CrossSellExcludeOutOfStock ?? true;

        var cartProductIds = cart.Items.Select(i => i.ProductId.Value).ToHashSet();

        var lineProducts = new List<Product>();
        foreach (var productId in cart.Items.Select(i => i.ProductId).Distinct().Take(MaxCartLinesConsidered))
        {
            var product = await _productRepository.GetByIdWithPropertyValuesAsync(productId, ct);
            if (product is not null)
                lineProducts.Add(product);
        }

        var recommendations = await _recommendationService.RecommendForCartAsync(
            storeId, lineProducts, cartProductIds, excludeOutOfStock, take, ct);

        return Result.Success<IReadOnlyList<ProductPublicDto>>(
            recommendations.Select(ProductRecommendationMapper.Map).ToList());
    }
}
