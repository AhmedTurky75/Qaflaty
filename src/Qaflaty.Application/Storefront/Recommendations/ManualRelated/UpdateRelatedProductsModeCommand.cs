using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualRelated;

public record UpdateRelatedProductsModeCommand(
    StoreId StoreId,
    bool Manual
) : ICommand;
