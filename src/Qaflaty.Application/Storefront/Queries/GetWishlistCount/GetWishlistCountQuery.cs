using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetWishlistCount;

public record GetWishlistCountQuery(StoreCustomerId CustomerId) : IQuery<int>;
