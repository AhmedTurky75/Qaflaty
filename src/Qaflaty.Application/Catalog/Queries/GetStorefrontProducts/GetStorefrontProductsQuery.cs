using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Models;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontProducts;

public record GetStorefrontProductsQuery(
    string StoreSlug,
    Guid? CategoryId,
    string? Search = null,
    string? SortBy = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    int PageNumber = 1,
    int PageSize = 20,
    // "definitionId:value" pairs for custom property filters
    List<string>? PropertyFilters = null,
    // Hand-picked product slugs. When supplied, only these products are
    // returned, in the order given, and sorting is ignored.
    List<string>? Slugs = null
) : IQuery<PaginatedList<ProductPublicDto>>;
