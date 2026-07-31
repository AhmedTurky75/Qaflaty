using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualUpSell;

public record SetUpSellProductsCommand(
    StoreId StoreId,
    ProductId ProductId,
    IReadOnlyList<Guid> UpSellProductIds
) : ICommand;
