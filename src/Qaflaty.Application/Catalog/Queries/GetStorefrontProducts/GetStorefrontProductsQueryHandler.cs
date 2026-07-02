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

        var hasPropertyFilters = request.PropertyFilters != null && request.PropertyFilters.Count > 0;

        var products = hasPropertyFilters
            ? await _productRepository.GetByStoreIdWithPropertyValuesAsync(store.Id, cancellationToken)
            : await _productRepository.GetByStoreIdAsync(store.Id, cancellationToken);

        var query = products.Where(p => p.Status == ProductStatus.Active);

        if (request.CategoryId.HasValue)
        {
            var categoryId = new CategoryId(request.CategoryId.Value);
            query = query.Where(p => p.CategoryId?.Value == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLowerInvariant();
            query = query.Where(p =>
                p.Name.Value.ToLowerInvariant().Contains(search) ||
                (p.Description != null && p.Description.ToLowerInvariant().Contains(search)));
        }

        if (request.MinPrice.HasValue)
            query = query.Where(p => p.Pricing.Price.Amount >= request.MinPrice.Value);

        if (request.MaxPrice.HasValue)
            query = query.Where(p => p.Pricing.Price.Amount <= request.MaxPrice.Value);

        if (hasPropertyFilters)
        {
            // Each entry is "definitionId:value"; a product must match ALL supplied filters
            foreach (var filterEntry in request.PropertyFilters!)
            {
                var colonIdx = filterEntry.IndexOf(':');
                if (colonIdx <= 0) continue;

                var rawId = filterEntry[..colonIdx];
                var filterValue = filterEntry[(colonIdx + 1)..];

                if (!Guid.TryParse(rawId, out var definitionGuid)) continue;
                var definitionId = new ProductPropertyDefinitionId(definitionGuid);

                query = query.Where(p =>
                    p.PropertyValues.Any(v =>
                        v.DefinitionId == definitionId &&
                        v.Value.Equals(filterValue, StringComparison.OrdinalIgnoreCase)));
            }
        }

        if (!string.IsNullOrWhiteSpace(request.SortBy) &&
            Enum.TryParse<ProductSortOption>(request.SortBy, true, out var sortOption))
        {
            query = sortOption switch
            {
                ProductSortOption.PriceAsc  => query.OrderBy(p => p.Pricing.Price.Amount),
                ProductSortOption.PriceDesc => query.OrderByDescending(p => p.Pricing.Price.Amount),
                ProductSortOption.NameAsc   => query.OrderBy(p => p.Name.Value),
                ProductSortOption.NameDesc  => query.OrderByDescending(p => p.Name.Value),
                _                           => query.OrderByDescending(p => p.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(p => p.CreatedAt);
        }

        var dtos = query.Select(p => new ProductPublicDto(
            p.Id.Value,
            p.Slug.Value,
            p.Name.Value,
            p.Name.Arabic,
            p.Description,
            p.Pricing.Price.Amount,
            p.Pricing.CompareAtPrice?.Amount,
            p.Inventory.InStock,
            p.Images.Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.SortOrder)).ToList()
        ));

        return Result.Success(PaginatedList<ProductPublicDto>.Create(dtos, request.PageNumber, request.PageSize));
    }
}
