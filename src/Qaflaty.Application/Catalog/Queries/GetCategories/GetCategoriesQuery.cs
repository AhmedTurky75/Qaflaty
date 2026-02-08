using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetCategories;

public record GetCategoriesQuery(Guid StoreId) : IQuery<List<CategoryDto>>;
