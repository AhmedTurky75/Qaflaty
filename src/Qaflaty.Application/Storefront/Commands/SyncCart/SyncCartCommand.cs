using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;

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
) : ICommand<CartDto>;
