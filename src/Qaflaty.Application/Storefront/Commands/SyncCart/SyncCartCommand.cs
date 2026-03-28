using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Commands.SyncCart;

public record GuestCartItemDto(
    Guid ProductId,
    Guid? VariantId,
    int Quantity
);

public record SyncCartCommand(
    CartOwnerContext Owner,
    List<GuestCartItemDto> GuestItems,
    string? GuestSessionId = null
) : ICommand;
