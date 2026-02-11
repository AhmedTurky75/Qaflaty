using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetProductBySlug;

public class GetProductBySlugQueryHandler : IQueryHandler<GetProductBySlugQuery, ProductPublicDto>
{
    private readonly IProductRepository _productRepository;

    public GetProductBySlugQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<ProductPublicDto>> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var slugResult = ProductSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<ProductPublicDto>(CatalogErrors.ProductNotFound);

        var storeId = new StoreId(request.StoreId);
        var product = await _productRepository.GetBySlugAsync(storeId, slugResult.Value, cancellationToken);

        if (product == null || product.Status != ProductStatus.Active)
            return Result.Failure<ProductPublicDto>(CatalogErrors.ProductNotFound);

        return Result.Success(new ProductPublicDto(
            product.Id.Value,
            product.Slug.Value,
            product.Name.Value,
            product.Description,
            product.Pricing.Price.Amount,
            product.Pricing.CompareAtPrice?.Amount,
            product.Inventory.Quantity > 0,
            product.Images.Select(i => new ProductImageDto(
                i.Id,
                i.Url,
                i.AltText,
                i.SortOrder
            )).OrderBy(i => i.SortOrder).ToList()));
    }
}
