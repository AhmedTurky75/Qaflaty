using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Commands.AddCartItem;

public record AddCartItemCommand(
    CartOwnerContext Owner,
    Guid ProductId,
    int Quantity,
    Guid? VariantId = null
) : ICommand;
