using Qaflaty.Application.Catalog.Commands.ActivateProduct;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Application.Handlers;

public class ActivateProductCommandHandlerTests
{
    private static Product DraftProduct()
        => Product.Create(
            StoreId.New(),
            ProductName.Create("Test").Value,
            ProductSlug.Create("test-product").Value,
            ProductPricing.Create(Money.Create(100m).Value).Value,
            ProductInventory.Create(10).Value).Value;

    [Fact]
    public async Task Handle_UnknownProduct_ReturnsNotFound()
    {
        var repo = new InMemoryProductRepository(); // empty
        var handler = new ActivateProductCommandHandler(repo);

        var result = await handler.Handle(new ActivateProductCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.ProductNotFound", result.Error.Code);
        Assert.Equal(0, repo.UpdateCallCount);
    }

    [Fact]
    public async Task Handle_ExistingProduct_ActivatesAndPersists()
    {
        var product = DraftProduct();
        Assert.Equal(ProductStatus.Draft, product.Status); // precondition
        var repo = new InMemoryProductRepository(product);
        var handler = new ActivateProductCommandHandler(repo);

        var result = await handler.Handle(new ActivateProductCommand(product.Id.Value), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ProductStatus.Active, product.Status);
        Assert.Equal(1, repo.UpdateCallCount);
        Assert.Same(product, repo.LastUpdated);
    }
}
