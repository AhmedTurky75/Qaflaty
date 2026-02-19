using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;

namespace Qaflaty.Application.Storefront.Queries.GetActiveCarts;

public record GetActiveCartsQuery(Guid StoreId) : IQuery<List<ActiveCartDto>>;
