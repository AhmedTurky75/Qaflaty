using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Commands.UpdateCartItemQuantity;

public record UpdateCartItemQuantityCommand(
    CartOwnerContext Owner,
    Guid ProductId,
    int Quantity,
    Guid? VariantId = null
) : ICommand;
