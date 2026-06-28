using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetPromoCodes;

public record GetPromoCodesQuery(StoreId StoreId) : IQuery<IReadOnlyList<PromoCodeDto>>;
