using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Storefront;

public class CartTests
{
    private static Cart GuestCart() =>
        Cart.CreateForGuest("guest-123", StoreId.New()).Value;

    private static Cart CustomerCart() =>
        Cart.CreateForCustomer(StoreCustomerId.New(), StoreId.New()).Value;

    [Fact]
    public void CreateForGuest_IsGuestCart()
    {
        var cart = GuestCart();

        Assert.True(cart.IsGuestCart);
        Assert.Equal("guest-123", cart.GuestId);
        Assert.Null(cart.CustomerId);
    }

    [Fact]
    public void CreateForGuest_BlankId_Fails()
    {
        var result = Cart.CreateForGuest("  ", StoreId.New());

        Assert.True(result.IsFailure);
        Assert.Equal("Cart.InvalidGuestId", result.Error.Code);
    }

    [Fact]
    public void CreateForCustomer_IsNotGuestCart()
    {
        var cart = CustomerCart();

        Assert.False(cart.IsGuestCart);
        Assert.NotNull(cart.CustomerId);
    }

    [Fact]
    public void AddItem_NewProduct_AddsLine()
    {
        var cart = GuestCart();

        var result = cart.AddItem(ProductId.New(), 2);

        Assert.True(result.IsSuccess);
        Assert.Single(cart.Items);
        Assert.Equal(2, cart.TotalItems);
    }

    [Fact]
    public void AddItem_SameProductAndVariant_IncrementsQuantity()
    {
        var cart = GuestCart();
        var productId = ProductId.New();

        cart.AddItem(productId, 1);
        cart.AddItem(productId, 3);

        Assert.Single(cart.Items);
        Assert.Equal(4, cart.Items[0].Quantity);
    }

    [Fact]
    public void AddItem_SameProductDifferentVariant_AddsSeparateLine()
    {
        var cart = GuestCart();
        var productId = ProductId.New();

        cart.AddItem(productId, 1, Guid.NewGuid());
        cart.AddItem(productId, 1, Guid.NewGuid());

        Assert.Equal(2, cart.Items.Count);
    }

    [Fact]
    public void AddItem_NonPositiveQuantity_Fails()
    {
        var cart = GuestCart();

        var result = cart.AddItem(ProductId.New(), 0);

        Assert.True(result.IsFailure);
        Assert.Equal("Cart.InvalidQuantity", result.Error.Code);
    }

    [Fact]
    public void UpdateItemQuantity_ExistingItem_SetsAbsoluteQuantity()
    {
        var cart = GuestCart();
        var productId = ProductId.New();
        cart.AddItem(productId, 5);

        var result = cart.UpdateItemQuantity(productId, 2);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, cart.Items[0].Quantity);
    }

    [Fact]
    public void UpdateItemQuantity_MissingItem_Fails()
    {
        var cart = GuestCart();

        var result = cart.UpdateItemQuantity(ProductId.New(), 2);

        Assert.True(result.IsFailure);
        Assert.Equal("Cart.ItemNotFound", result.Error.Code);
    }

    [Fact]
    public void RemoveItem_ExistingItem_Removes()
    {
        var cart = GuestCart();
        var productId = ProductId.New();
        cart.AddItem(productId, 1);

        var result = cart.RemoveItem(productId);

        Assert.True(result.IsSuccess);
        Assert.Empty(cart.Items);
    }

    [Fact]
    public void RemoveItem_MissingItem_Fails()
    {
        var cart = GuestCart();

        var result = cart.RemoveItem(ProductId.New());

        Assert.True(result.IsFailure);
        Assert.Equal("Cart.ItemNotFound", result.Error.Code);
    }

    [Fact]
    public void ClearAll_EmptiesCart()
    {
        var cart = GuestCart();
        cart.AddItem(ProductId.New(), 1);
        cart.AddItem(ProductId.New(), 1);

        cart.ClearAll();

        Assert.Empty(cart.Items);
        Assert.Equal(0, cart.TotalItems);
    }

    [Fact]
    public void MergeGuestCart_CombinesQuantitiesAndAddsNew()
    {
        var cart = CustomerCart();
        var shared = ProductId.New();
        cart.AddItem(shared, 1);

        var newProduct = ProductId.New();
        cart.MergeGuestCart(
        [
            (shared, null, 2),      // merges -> 3
            (newProduct, null, 5)   // adds new line
        ]);

        Assert.Equal(2, cart.Items.Count);
        Assert.Equal(3, cart.Items.First(i => i.ProductId == shared).Quantity);
        Assert.Equal(5, cart.Items.First(i => i.ProductId == newProduct).Quantity);
    }
}
