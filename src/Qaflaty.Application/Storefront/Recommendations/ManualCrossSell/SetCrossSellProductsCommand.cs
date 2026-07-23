using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualCrossSell;

public record SetCrossSellProductsCommand(
    StoreId StoreId,
    ProductId ProductId,
    IReadOnlyList<Guid> CrossSellProductIds
) : ICommand;
