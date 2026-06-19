using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.TrackProductView;

public record TrackProductViewCommand(
    StoreId StoreId,
    ProductId ProductId,
    StoreCustomerId? CustomerId,
    string? SessionId
) : ICommand;
