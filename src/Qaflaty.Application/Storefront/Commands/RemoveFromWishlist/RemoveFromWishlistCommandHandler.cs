using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.RemoveFromWishlist;

public class RemoveFromWishlistCommandHandler : ICommandHandler<RemoveFromWishlistCommand>
{
    private readonly IWishlistRepository _wishlistRepository;

    public RemoveFromWishlistCommandHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task<Result> Handle(RemoveFromWishlistCommand request, CancellationToken cancellationToken)
    {
        var wishlist = await _wishlistRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);
        if (wishlist == null)
            return Result.Failure(new Error("Wishlist.NotFound", "Wishlist not found"));

        var result = wishlist.RemoveItem(request.ProductId, request.VariantId);
        if (result.IsFailure)
            return result;

        _wishlistRepository.Update(wishlist);

        return Result.Success();
    }
}
