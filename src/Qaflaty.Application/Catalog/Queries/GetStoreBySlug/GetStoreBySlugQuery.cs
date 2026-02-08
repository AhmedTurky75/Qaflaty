using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStoreBySlug;

public record GetStoreBySlugQuery(string Slug) : IQuery<StorePublicDto>;
