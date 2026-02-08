using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Models;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontProducts;

public record GetStorefrontProductsQuery(
    string StoreSlug,
    Guid? CategoryId,
    int PageNumber = 1,
    int PageSize = 20
) : IQuery<PaginatedList<ProductPublicDto>>;
