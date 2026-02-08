using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Models;

namespace Qaflaty.Application.Catalog.Queries.GetProducts;

public record GetProductsQuery(
    Guid StoreId,
    string? SearchTerm,
    Guid? CategoryId,
    string? Status,
    int PageNumber = 1,
    int PageSize = 20
) : IQuery<PaginatedList<ProductListDto>>;
