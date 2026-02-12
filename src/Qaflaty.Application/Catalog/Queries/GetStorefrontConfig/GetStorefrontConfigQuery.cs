using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontConfig;

public record GetStorefrontConfigQuery(Guid StoreId) : IQuery<StorefrontConfigDto>;
