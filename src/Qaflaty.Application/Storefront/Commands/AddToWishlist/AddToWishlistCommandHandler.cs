using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.AddToWishlist;

public class AddToWishlistCommandHandler : ICommandHandler<AddToWishlistCommand>
{
    private readonly IWishlistRepository _wishlistRepository;

    public AddToWishlistCommandHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task<Result> Handle(AddToWishlistCommand request, CancellationToken cancellationToken)
    {
        // Get or create wishlist for customer
        var wishlist = await _wishlistRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);

        if (wishlist == null)
        {
            var createResult = Wishlist.Create(request.CustomerId);
            if (createResult.IsFailure)
                return createResult;

            wishlist = createResult.Value;
            await _wishlistRepository.AddAsync(wishlist, cancellationToken);
        }

        // Add item to wishlist
        var result = wishlist.AddItem(request.ProductId, request.VariantId);
        if (result.IsFailure)
            return result;

        _wishlistRepository.Update(wishlist);

        return Result.Success();
    }
}
