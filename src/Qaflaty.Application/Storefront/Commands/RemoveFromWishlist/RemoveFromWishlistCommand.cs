using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.RemoveFromWishlist;

public record RemoveFromWishlistCommand(
    StoreCustomerId CustomerId,
    ProductId ProductId,
    Guid? VariantId = null
) : ICommand;
