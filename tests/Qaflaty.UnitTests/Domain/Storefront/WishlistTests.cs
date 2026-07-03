using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Storefront;

public class WishlistTests
{
    private static Wishlist NewWishlist() =>
        Wishlist.Create(StoreCustomerId.New()).Value;

    [Fact]
    public void AddItem_NewProduct_Adds()
    {
        var wishlist = NewWishlist();
        var productId = ProductId.New();

        var result = wishlist.AddItem(productId);

        Assert.True(result.IsSuccess);
        Assert.True(wishlist.ContainsItem(productId));
    }

    [Fact]
    public void AddItem_Duplicate_Fails()
    {
        var wishlist = NewWishlist();
        var productId = ProductId.New();
        wishlist.AddItem(productId);

        var result = wishlist.AddItem(productId);

        Assert.True(result.IsFailure);
        Assert.Equal("Wishlist.ItemAlreadyExists", result.Error.Code);
        Assert.Single(wishlist.Items);
    }

    [Fact]
    public void AddItem_SameProductDifferentVariant_AddsSeparately()
    {
        var wishlist = NewWishlist();
        var productId = ProductId.New();

        wishlist.AddItem(productId, Guid.NewGuid());
        var result = wishlist.AddItem(productId, Guid.NewGuid());

        Assert.True(result.IsSuccess);
        Assert.Equal(2, wishlist.Items.Count);
    }

    [Fact]
    public void RemoveItem_Existing_Removes()
    {
        var wishlist = NewWishlist();
        var productId = ProductId.New();
        wishlist.AddItem(productId);

        var result = wishlist.RemoveItem(productId);

        Assert.True(result.IsSuccess);
        Assert.False(wishlist.ContainsItem(productId));
    }

    [Fact]
    public void RemoveItem_Missing_Fails()
    {
        var wishlist = NewWishlist();

        var result = wishlist.RemoveItem(ProductId.New());

        Assert.True(result.IsFailure);
        Assert.Equal("Wishlist.ItemNotFound", result.Error.Code);
    }

    [Fact]
    public void ClearAll_Empties()
    {
        var wishlist = NewWishlist();
        wishlist.AddItem(ProductId.New());
        wishlist.AddItem(ProductId.New());

        wishlist.ClearAll();

        Assert.Empty(wishlist.Items);
    }
}
