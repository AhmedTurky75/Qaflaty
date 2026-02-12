using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.SyncCart;

public record GuestCartItemDto(
    Guid ProductId,
    Guid? VariantId,
    int Quantity
);

public record SyncCartCommand(
    StoreCustomerId CustomerId,
    List<GuestCartItemDto> GuestItems
) : ICommand<CartDto>;
