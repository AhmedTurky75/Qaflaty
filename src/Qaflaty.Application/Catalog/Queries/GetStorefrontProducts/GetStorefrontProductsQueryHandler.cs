using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Models;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontProducts;

public class GetStorefrontProductsQueryHandler : IQueryHandler<GetStorefrontProductsQuery, PaginatedList<ProductPublicDto>>
{
    private readonly IStoreRepository _storeRepository;
    private readonly IProductRepository _productRepository;

    public GetStorefrontProductsQueryHandler(
        IStoreRepository storeRepository,
        IProductRepository productRepository)
    {
        _storeRepository = storeRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<PaginatedList<ProductPublicDto>>> Handle(GetStorefrontProductsQuery request, CancellationToken cancellationToken)
    {
        var slugResult = StoreSlug.Create(request.StoreSlug);
        if (slugResult.IsFailure)
            return Result.Failure<PaginatedList<ProductPublicDto>>(CatalogErrors.StoreNotFound);

        var store = await _storeRepository.GetBySlugAsync(slugResult.Value, cancellationToken);
        if (store == null)
            return Result.Failure<PaginatedList<ProductPublicDto>>(CatalogErrors.StoreNotFound);

        var products = await _productRepository.GetByStoreIdAsync(store.Id, cancellationToken);

        // Filter only active products
        var query = products.Where(p => p.Status == ProductStatus.Active);

        if (request.CategoryId.HasValue)
        {
            var categoryId = new CategoryId(request.CategoryId.Value);
            query = query.Where(p => p.CategoryId?.Value == categoryId.Value);
        }

        var dtos = query.Select(p => new ProductPublicDto(
            p.Id.Value,
            p.Slug.Value,
            p.Name.Value,
            p.Description,
            p.Pricing.Price.Amount,
            p.Pricing.CompareAtPrice?.Amount,
            p.Inventory.InStock,
            p.Images.Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.SortOrder)).ToList()
        ));

        return Result.Success(PaginatedList<ProductPublicDto>.Create(dtos, request.PageNumber, request.PageSize));
    }
}
