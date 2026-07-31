using Qaflaty.Application.Storefront.Commands.AddToWishlist;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;
using Xunit;

namespace Qaflaty.UnitTests.Application.Handlers;

public class AddToWishlistCommandHandlerTests
{
    [Fact]
    public async Task Handle_NoExistingWishlist_CreatesAndAddsItem()
    {
        var repo = new InMemoryWishlistRepository(); // none seeded
        var handler = new AddToWishlistCommandHandler(repo);
        var customerId = StoreCustomerId.New();
        var productId = ProductId.New();

        var result = await handler.Handle(new AddToWishlistCommand(customerId, productId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(1, repo.AddCallCount);   // new wishlist created
        Assert.Equal(1, repo.UpdateCallCount);
    }

    [Fact]
    public async Task Handle_ExistingWishlist_AddsWithoutCreating()
    {
        var customerId = StoreCustomerId.New();
        var wishlist = Wishlist.Create(customerId).Value;
        var repo = new InMemoryWishlistRepository(wishlist);
        var handler = new AddToWishlistCommandHandler(repo);

        var result = await handler.Handle(
            new AddToWishlistCommand(customerId, ProductId.New()), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, repo.AddCallCount); // reused existing wishlist
        Assert.Equal(1, repo.UpdateCallCount);
        Assert.Single(wishlist.Items);
    }

    [Fact]
    public async Task Handle_DuplicateItem_ReturnsFailure()
    {
        var customerId = StoreCustomerId.New();
        var productId = ProductId.New();
        var wishlist = Wishlist.Create(customerId).Value;
        wishlist.AddItem(productId);
        var repo = new InMemoryWishlistRepository(wishlist);
        var handler = new AddToWishlistCommandHandler(repo);

        var result = await handler.Handle(
            new AddToWishlistCommand(customerId, productId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Wishlist.ItemAlreadyExists", result.Error.Code);
        Assert.Equal(0, repo.UpdateCallCount); // not persisted on failure
    }
}
