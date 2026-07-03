using Qaflaty.Application.Ordering.Queries.CalculateOrder;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.UnitTests.Application.Handlers;
using Xunit;
using StoreAgg = Qaflaty.Domain.Catalog.Aggregates.Store.Store;
using StoreConfigAgg = Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration;
using static Qaflaty.UnitTests.Application.Ordering.OrderingTestHelpers;

namespace Qaflaty.UnitTests.Application.Ordering;

public class CalculateOrderQueryHandlerTests
{
    private static CalculateOrderQueryHandler Handler(
        StoreAgg store,
        Product[] products,
        StoreConfigAgg? config = null)
        => new(
            new FakeStoreRepository(store),
            new InMemoryProductRepository(products),
            new FakeDeliveryZoneRepository(),
            new FakeStoreConfigRepository(config));

    private static CalculateOrderQuery Query(Guid storeId, IEnumerable<CalculateOrderItemDto> items, string? paymentMethod = null)
        => new(storeId, CountryCode: 0, CityId: null, DistrictId: null, Items: items.ToList(), PaymentMethod: paymentMethod);

    [Fact]
    public async Task Handle_UnknownStore_ReturnsStoreNotFound()
    {
        var store = CreateStore();
        var handler = Handler(store, []);

        var result = await handler.Handle(Query(Guid.NewGuid(), []), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.StoreNotFound", result.Error.Code);
    }

    [Fact]
    public async Task Handle_UnknownProduct_ReturnsProductNotFound()
    {
        var store = CreateStore();
        var handler = Handler(store, []);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(Guid.NewGuid(), 1, null)]),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.ProductNotFound", result.Error.Code);
    }

    [Fact]
    public async Task Handle_ComputesSubtotalFromCatalogPrice_PlusDelivery()
    {
        var store = CreateStore(deliveryFee: 25m, currency: "EGP");
        var product = CreateProduct(store.Id, price: 100m);
        var handler = Handler(store, [product]);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(product.Id.Value, 2, null)]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(200m, result.Value.Subtotal.Amount);   // 100 x 2, from catalog not client
        Assert.Equal(25m, result.Value.DeliveryFee.Amount);
        Assert.Equal(225m, result.Value.Total.Amount);
        Assert.Equal("EGP", result.Value.Total.Currency);
        Assert.True(result.Value.IsDeliveryAvailable);
    }

    [Fact]
    public async Task Handle_UsesVariantPriceOverride()
    {
        var store = CreateStore(deliveryFee: 0m);
        var product = CreateProduct(store.Id, price: 100m);
        var variantId = AddVariant(product, priceOverride: 150m);
        var handler = Handler(store, [product]);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(product.Id.Value, 1, variantId)]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(150m, result.Value.Subtotal.Amount); // variant override, not base 100
    }

    [Fact]
    public async Task Handle_UnknownVariant_ReturnsVariantNotFound()
    {
        var store = CreateStore();
        var product = CreateProduct(store.Id, price: 100m);
        var handler = Handler(store, [product]);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(product.Id.Value, 1, Guid.NewGuid())]),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.VariantNotFound", result.Error.Code);
    }

    [Fact]
    public async Task Handle_AppliesFixedPaymentAdjustment()
    {
        var store = CreateStore(deliveryFee: 0m);
        var product = CreateProduct(store.Id, price: 200m);
        var config = ConfigWith(store.Id,
            adjustments: [Adjustment("COD", FeeAdjustmentType.Fixed, 10m, label: "COD fee")]);
        var handler = Handler(store, [product], config);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(product.Id.Value, 1, null)], paymentMethod: "COD"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(10m, result.Value.PaymentAdjustment.Amount);
        Assert.Equal("COD fee", result.Value.PaymentAdjustmentLabel);
        Assert.Equal(210m, result.Value.Total.Amount); // 200 + 0 delivery + 10
    }

    [Fact]
    public async Task Handle_AppliesPercentagePaymentAdjustment()
    {
        var store = CreateStore(deliveryFee: 0m);
        var product = CreateProduct(store.Id, price: 200m);
        var config = ConfigWith(store.Id,
            adjustments: [Adjustment("Visa", FeeAdjustmentType.Percentage, -5m, label: "Visa discount")]);
        var handler = Handler(store, [product], config);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(product.Id.Value, 1, null)], paymentMethod: "Visa"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(-10m, result.Value.PaymentAdjustment.Amount); // -5% of 200
        Assert.Equal(190m, result.Value.Total.Amount);
    }

    [Fact]
    public async Task Handle_AppliesTaxExclusive_OnSubtotalPlusDelivery()
    {
        var store = CreateStore(deliveryFee: 0m);
        var product = CreateProduct(store.Id, price: 100m);
        var config = ConfigWith(store.Id,
            tax: TaxSettings.Create(enabled: true, rate: 15m, pricesIncludeTax: false, label: "VAT"));
        var handler = Handler(store, [product], config);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(product.Id.Value, 1, null)]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(15m, result.Value.Tax!.Amount);   // 15% of 100
        Assert.Equal(115m, result.Value.Total.Amount);
        Assert.Equal("VAT", result.Value.TaxLabel);
        Assert.False(result.Value.PricesIncludeTax);
    }

    [Fact]
    public async Task Handle_TaxInclusive_ReportsTaxWithoutChangingTotal()
    {
        var store = CreateStore(deliveryFee: 0m);
        var product = CreateProduct(store.Id, price: 115m);
        var config = ConfigWith(store.Id,
            tax: TaxSettings.Create(enabled: true, rate: 15m, pricesIncludeTax: true, label: "VAT"));
        var handler = Handler(store, [product], config);

        var result = await handler.Handle(
            Query(store.Id.Value, [new CalculateOrderItemDto(product.Id.Value, 1, null)]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(15m, result.Value.Tax!.Amount);    // 15 contained in 115
        Assert.Equal(115m, result.Value.Total.Amount);  // unchanged
        Assert.True(result.Value.PricesIncludeTax);
    }
}
