using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetCustomerWishlist;

public class GetCustomerWishlistQueryHandler : IQueryHandler<GetCustomerWishlistQuery, WishlistDto?>
{
    private readonly IWishlistRepository _wishlistRepository;

    public GetCustomerWishlistQueryHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task<Result<WishlistDto?>> Handle(GetCustomerWishlistQuery request, CancellationToken cancellationToken)
    {
        var wishlist = await _wishlistRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);

        if (wishlist == null)
            return Result.Success<WishlistDto?>(null);

        var dto = new WishlistDto(
            wishlist.Id.Value,
            wishlist.CustomerId.Value,
            wishlist.Items.Select(i => new WishlistItemDto(
                i.Id,
                i.ProductId.Value,
                i.VariantId,
                i.AddedAt)).ToList(),
            wishlist.CreatedAt,
            wishlist.UpdatedAt);

        return Result.Success<WishlistDto?>(dto);
    }
}
