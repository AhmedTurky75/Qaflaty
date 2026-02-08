using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetCategoryTree;

public record GetCategoryTreeQuery(Guid StoreId) : IQuery<List<CategoryTreeDto>>;
