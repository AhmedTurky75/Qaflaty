using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualDownSell;

public record SetDownsellOfferCommand(
    StoreId StoreId,
    ProductId ProductId,
    IReadOnlyList<Guid> DownsellProductIds,
    Guid? PromoCodeId,
    bool IsEnabled
) : ICommand;
