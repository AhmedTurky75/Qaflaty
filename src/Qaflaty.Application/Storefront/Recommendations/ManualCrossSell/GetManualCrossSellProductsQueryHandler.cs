using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.ManualCrossSell;

/// <summary>Merchant view of the current hand-picked cross-sell products for one source product, in order.</summary>
public class GetManualCrossSellProductsQueryHandler
    : IQueryHandler<GetManualCrossSellProductsQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IRelatedProductRepository _relatedProductRepository;
    private readonly IProductRepository _productRepository;

    public GetManualCrossSellProductsQueryHandler(
        IRelatedProductRepository relatedProductRepository,
        IProductRepository productRepository)
    {
        _relatedProductRepository = relatedProductRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetManualCrossSellProductsQuery request, CancellationToken ct)
    {
        var links = await _relatedProductRepository.GetByProductIdAsync(
            request.ProductId, ProductRelationType.CrossSell, ct);

        var storeProducts = await _productRepository.GetByStoreIdAsync(request.StoreId, ct);
        var byId = storeProducts.ToDictionary(p => p.Id.Value);

        var selected = links
            .Select(l => l.RelatedProductId.Value)
            .Where(byId.ContainsKey)
            .Select(id => ProductRecommendationMapper.Map(byId[id]))
            .ToList();

        return Result.Success<IReadOnlyList<ProductPublicDto>>(selected);
    }
}
