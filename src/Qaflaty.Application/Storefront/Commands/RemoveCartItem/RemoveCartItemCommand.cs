using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Commands.RemoveCartItem;

public record RemoveCartItemCommand(
    CartOwnerContext Owner,
    Guid ProductId,
    Guid? VariantId = null
) : ICommand;
