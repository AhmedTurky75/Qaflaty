using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.ValidatePromoCode;

public record ValidatePromoCodeItem(Guid ProductId, int Quantity, Guid? VariantId);

public record ValidatePromoCodeQuery(
    StoreId StoreId,
    string Code,
    List<ValidatePromoCodeItem> Items
) : IQuery<PromoCodeValidationDto>;
