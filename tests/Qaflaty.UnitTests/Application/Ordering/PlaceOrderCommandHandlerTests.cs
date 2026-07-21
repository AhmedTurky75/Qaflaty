using Qaflaty.Application.Ordering.Commands.PlaceOrder;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.UnitTests.Application.Handlers;
using Xunit;
using StoreAgg = Qaflaty.Domain.Catalog.Aggregates.Store.Store;
using StoreConfigAgg = Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration;
using static Qaflaty.UnitTests.Application.Ordering.OrderingTestHelpers;

namespace Qaflaty.UnitTests.Application.Ordering;

public class PlaceOrderCommandHandlerTests
{
    private static PlaceOrderCommandHandler BuildHandler(
        StoreAgg store,
        Product[] products,
        StoreConfigAgg? config = null,
        PromoCode? promo = null,
        int customerRedemptions = 0,
        FakeOrderRepository? orderRepo = null,
        FakeOrderOtpRepository? otpRepo = null,
        FakeEmailService? email = null)
        => new(
            orderRepo ?? new FakeOrderRepository(),
            new FakeCustomerRepository(),
            new FakeStoreRepository(store),
            new InMemoryProductRepository(products),
            new FakeDeliveryZoneRepository(),
            new FakeOrderNumberGenerator(),
            otpRepo ?? new FakeOrderOtpRepository(),
            email ?? new FakeEmailService(),
            new FakeOtpSettings(),
            new FakeStoreConfigRepository(config),
            new FakePromoCodeRepository(promo, customerRedemptions),
            new FakeCartConversionService());

    private static PlaceOrderCommand Command(
        Guid storeId,
        Guid productId,
        int quantity = 2,
        Guid? variantId = null,
        string email = "buyer@example.com",
        string paymentMethod = "COD",
        string? promoCode = null)
        => new(
            StoreId: storeId,
            CustomerName: "Ahmed Ali",
            CustomerPhone: "01012345678",
            CustomerPhoneCountryCode: "EG",
            CustomerEmail: email,
            Street: "King Fahd Rd",
            City: "Cairo",
            District: null,
            Country: "Egypt",
            DeliveryInstructions: null,
            CustomerNotes: null,
            PaymentMethod: paymentMethod,
            Items: [new PlaceOrderItemDto(productId, quantity, variantId)],
            PromoCode: promoCode);

    [Fact]
    public async Task Handle_UnknownStore_ReturnsStoreNotFound()
    {
        var store = CreateStore();
        var handler = BuildHandler(store, []);

        var result = await handler.Handle(Command(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.StoreNotFound", result.Error.Code);
    }

    [Fact]
    public async Task Handle_EmptyEmail_ReturnsEmailRequired()
    {
        var store = CreateStore();
        var product = CreateProduct(store.Id);
        var handler = BuildHandler(store, [product]);

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value, email: ""), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.EmailRequired", result.Error.Code);
    }

    [Fact]
    public async Task Handle_UnknownProduct_ReturnsProductNotFound()
    {
        var store = CreateStore();
        var handler = BuildHandler(store, []);

        var result = await handler.Handle(
            Command(store.Id.Value, Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.ProductNotFound", result.Error.Code);
    }

    [Fact]
    public async Task Handle_HappyPath_NoOtp_ConfirmsOrderWithCatalogPricing()
    {
        var store = CreateStore(deliveryFee: 25m, currency: "EGP");
        var product = CreateProduct(store.Id, price: 100m);
        var orderRepo = new FakeOrderRepository();
        var handler = BuildHandler(store, [product], orderRepo: orderRepo);

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value, quantity: 2), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Confirmed", result.Value.Status);            // no OTP required -> confirmed immediately
        Assert.Equal(200m, result.Value.Pricing.Subtotal.Amount);  // 100 x 2 from catalog
        Assert.Equal(225m, result.Value.Pricing.Total.Amount);     // + 25 delivery
        Assert.Equal("EGP", result.Value.Pricing.Total.Currency);
        Assert.Equal(1, orderRepo.AddCallCount);
    }

    [Fact]
    public async Task Handle_UsesVariantPriceOverride_ForLineItem()
    {
        var store = CreateStore(deliveryFee: 0m);
        var product = CreateProduct(store.Id, price: 100m);
        var variantId = AddVariant(product, priceOverride: 150m);
        var handler = BuildHandler(store, [product]);

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value, quantity: 1, variantId: variantId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(150m, result.Value.Pricing.Subtotal.Amount); // variant override, not base 100
    }

    [Fact]
    public async Task Handle_DisabledPaymentMethod_Fails()
    {
        var store = CreateStore();
        var product = CreateProduct(store.Id);
        var config = ConfigWith(store.Id,
            adjustments: [Adjustment("COD", FeeAdjustmentType.Fixed, 0m, enabled: false)]);
        var handler = BuildHandler(store, [product], config);

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value, paymentMethod: "COD"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.PaymentMethodDisabled", result.Error.Code);
    }

    [Fact]
    public async Task Handle_PaymentMethodNotConfigured_Fails()
    {
        var store = CreateStore();
        var product = CreateProduct(store.Id);
        // Config has adjustments but not the requested "Visa" key.
        var config = ConfigWith(store.Id,
            adjustments: [Adjustment("COD", FeeAdjustmentType.Fixed, 0m, enabled: true)]);
        var handler = BuildHandler(store, [product], config);

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value, paymentMethod: "Visa"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.PaymentMethodNotConfigured", result.Error.Code);
    }

    [Fact]
    public async Task Handle_WithValidPromoCode_AppliesDiscountAndRecordsRedemption()
    {
        var store = CreateStore(deliveryFee: 0m);
        var product = CreateProduct(store.Id, price: 100m);
        var promo = PromoCode.Create(
            store.Id, "SAVE10", null, PromoDiscountType.Percentage, 10m,
            null, null, null, null, null, null).Value;
        var promoRepo = new FakePromoCodeRepository(promo);
        var handler = new PlaceOrderCommandHandler(
            new FakeOrderRepository(), new FakeCustomerRepository(), new FakeStoreRepository(store),
            new InMemoryProductRepository(product), new FakeDeliveryZoneRepository(),
            new FakeOrderNumberGenerator(), new FakeOrderOtpRepository(), new FakeEmailService(),
            new FakeOtpSettings(), new FakeStoreConfigRepository(null), promoRepo,
            new FakeCartConversionService());

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value, quantity: 2, promoCode: "SAVE10"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("SAVE10", result.Value.AppliedPromoCode);
        Assert.Equal(20m, result.Value.Pricing.DiscountAmount!.Amount); // 10% of 200
        Assert.Equal(180m, result.Value.Pricing.Total.Amount);
        Assert.Equal(1, promoRepo.UpdateCallCount);
        Assert.Equal(1, promoRepo.RedemptionAddCount);
    }

    [Fact]
    public async Task Handle_UnknownPromoCode_Fails()
    {
        var store = CreateStore();
        var product = CreateProduct(store.Id);
        var handler = BuildHandler(store, [product], promo: null);

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value, promoCode: "NOPE"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.NotFound", result.Error.Code);
    }

    [Fact]
    public async Task Handle_WhenOtpRequired_OrderStaysPendingAndEmailSent()
    {
        var store = CreateStore();
        var product = CreateProduct(store.Id);
        var config = ConfigWith(store.Id, requireOtpOnPlaceOrder: true);
        var otpRepo = new FakeOrderOtpRepository();
        var email = new FakeEmailService();
        var handler = BuildHandler(store, [product], config, otpRepo: otpRepo, email: email);

        var result = await handler.Handle(
            Command(store.Id.Value, product.Id.Value), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Pending", result.Value.Status); // not confirmed until OTP verified
        Assert.NotNull(otpRepo.Added);
        Assert.Equal(1, email.SentCount);
        Assert.Equal("buyer@example.com", email.LastTo);
    }
}
