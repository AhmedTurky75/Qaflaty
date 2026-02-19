using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.UpdateCartItemQuantity;

public record UpdateCartItemQuantityCommand(
    StoreCustomerId CustomerId,
    Guid ProductId,
    int Quantity,
    Guid? VariantId = null
) : ICommand;
