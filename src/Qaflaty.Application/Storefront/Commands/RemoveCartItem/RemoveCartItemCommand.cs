using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.RemoveCartItem;

public record RemoveCartItemCommand(
    StoreCustomerId CustomerId,
    Guid ProductId,
    Guid? VariantId = null
) : ICommand;
