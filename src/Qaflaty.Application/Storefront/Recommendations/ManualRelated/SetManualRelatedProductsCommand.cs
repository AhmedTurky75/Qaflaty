using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualRelated;

public record SetManualRelatedProductsCommand(
    StoreId StoreId,
    ProductId ProductId,
    IReadOnlyList<Guid> RelatedProductIds
) : ICommand;
