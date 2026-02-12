using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.AddToWishlist;

public record AddToWishlistCommand(
    StoreCustomerId CustomerId,
    ProductId ProductId,
    Guid? VariantId = null
) : ICommand;
