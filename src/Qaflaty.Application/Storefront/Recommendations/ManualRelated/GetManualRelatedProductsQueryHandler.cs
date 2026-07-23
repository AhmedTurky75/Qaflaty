using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;
using Qaflaty.Application.Storefront.Recommendations;

namespace Qaflaty.Application.Storefront.Recommendations.ManualRelated;

public class GetManualRelatedProductsQueryHandler
    : IQueryHandler<GetManualRelatedProductsQuery, ManualRelatedProductsDto>
{
    private readonly IRelatedProductRepository _relatedProductRepository;
    private readonly IProductRepository _productRepository;
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public GetManualRelatedProductsQueryHandler(
        IRelatedProductRepository relatedProductRepository,
        IProductRepository productRepository,
        IStoreConfigurationRepository storeConfigRepository)
    {
        _relatedProductRepository = relatedProductRepository;
        _productRepository = productRepository;
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result<ManualRelatedProductsDto>> Handle(
        GetManualRelatedProductsQuery request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        var manual = config?.RelatedProductsManual ?? false;

        var links = await _relatedProductRepository.GetByProductIdAsync(
            request.ProductId, ProductRelationType.Related, ct);

        var storeProducts = await _productRepository.GetByStoreIdAsync(request.StoreId, ct);
        var byId = storeProducts.ToDictionary(p => p.Id.Value);

        var selected = links
            .Select(l => l.RelatedProductId.Value)
            .Where(byId.ContainsKey)
            .Select(id => ProductRecommendationMapper.Map(byId[id]))
            .ToList();

        return Result.Success(new ManualRelatedProductsDto(manual, selected));
    }
}
