using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetCustomerWishlist;

public class GetCustomerWishlistQueryHandler : IQueryHandler<GetCustomerWishlistQuery, WishlistDto?>
{
    private readonly IWishlistRepository _wishlistRepository;
    private readonly IProductRepository _productRepository;

    public GetCustomerWishlistQueryHandler(
        IWishlistRepository wishlistRepository,
        IProductRepository productRepository)
    {
        _wishlistRepository = wishlistRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<WishlistDto?>> Handle(GetCustomerWishlistQuery request, CancellationToken cancellationToken)
    {
        var wishlist = await _wishlistRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);

        if (wishlist == null)
            return Result.Success<WishlistDto?>(null);

        var items = new List<WishlistItemDto>();
        foreach (var item in wishlist.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (product is null)
                continue; // product was removed after it was wishlisted

            var image = product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();

            items.Add(new WishlistItemDto(
                item.Id,
                item.ProductId.Value,
                item.VariantId,
                item.AddedAt,
                product.Name.Value,
                product.Slug.Value,
                product.Pricing.Price.Amount,
                product.Pricing.CompareAtPrice?.Amount,
                product.Inventory.InStock,
                image?.Url,
                null));
        }

        var dto = new WishlistDto(
            wishlist.Id.Value,
            wishlist.CustomerId.Value,
            items,
            wishlist.CreatedAt,
            wishlist.UpdatedAt);

        return Result.Success<WishlistDto?>(dto);
    }
}
