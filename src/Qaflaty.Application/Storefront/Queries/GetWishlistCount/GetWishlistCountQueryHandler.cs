using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetWishlistCount;

public class GetWishlistCountQueryHandler : IQueryHandler<GetWishlistCountQuery, int>
{
    private readonly IWishlistRepository _wishlistRepository;

    public GetWishlistCountQueryHandler(IWishlistRepository wishlistRepository)
    {
        _wishlistRepository = wishlistRepository;
    }

    public async Task<Result<int>> Handle(GetWishlistCountQuery request, CancellationToken cancellationToken)
    {
        var wishlist = await _wishlistRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);
        return Result.Success(wishlist?.Items.Count ?? 0);
    }
}
