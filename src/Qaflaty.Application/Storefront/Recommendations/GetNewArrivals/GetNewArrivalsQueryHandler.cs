using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Recommendations.GetNewArrivals;

public class GetNewArrivalsQueryHandler
    : IQueryHandler<GetNewArrivalsQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductRepository _productRepository;

    public GetNewArrivalsQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetNewArrivalsQuery request, CancellationToken ct)
    {
        var products = await _productRepository.GetByStoreIdAsync(request.StoreId, ct);

        var result = products
            .Where(p => p.Status == ProductStatus.Active)
            .OrderByDescending(p => p.CreatedAt)
            .Take(request.Take)
            .Select(ProductRecommendationMapper.Map)
            .ToList();

        return Result.Success<IReadOnlyList<ProductPublicDto>>(result);
    }
}
