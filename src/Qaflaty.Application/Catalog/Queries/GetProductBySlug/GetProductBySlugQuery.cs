using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetProductBySlug;

public record GetProductBySlugQuery(Guid StoreId, string Slug) : IQuery<ProductPublicDto>;
