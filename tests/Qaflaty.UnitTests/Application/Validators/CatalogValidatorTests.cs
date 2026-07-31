using Qaflaty.Application.Catalog.Commands.CreateProduct;
using Qaflaty.Application.Catalog.Commands.CreatePromoCode;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class CreateProductCommandValidatorTests
{
    private static readonly CreateProductCommandValidator Validator = new();

    private static CreateProductCommand Valid(
        string name = "Blue Shirt",
        string slug = "blue-shirt",
        decimal price = 100m,
        decimal? compareAt = null,
        int quantity = 10)
        => new(
            StoreId: Guid.NewGuid(),
            Name: name,
            NameAr: null,
            Slug: slug,
            Description: null,
            Price: price,
            CompareAtPrice: compareAt,
            Quantity: quantity,
            Sku: null,
            TrackInventory: true,
            CategoryId: null,
            Status: null,
            Images: null);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyStoreId_Fails()
        => Validator.ValidateCommand(Valid() with { StoreId = Guid.Empty }).ShouldHaveErrorFor("StoreId");

    [Fact]
    public void EmptyName_Fails()
        => Validator.ValidateCommand(Valid(name: "")).ShouldHaveErrorFor("Name");

    [Theory]
    [InlineData("")]
    [InlineData("ab")]          // too short
    [InlineData("Has Space")]   // invalid chars
    [InlineData("UPPER")]       // uppercase not allowed
    public void InvalidSlug_Fails(string slug)
        => Validator.ValidateCommand(Valid(slug: slug)).ShouldHaveErrorFor("Slug");

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void NonPositivePrice_Fails(decimal price)
        => Validator.ValidateCommand(Valid(price: price)).ShouldHaveErrorFor("Price");

    [Fact]
    public void CompareAtBelowPrice_Fails()
        => Validator.ValidateCommand(Valid(price: 100m, compareAt: 80m)).ShouldHaveErrorFor("CompareAtPrice");

    [Fact]
    public void CompareAtAbovePrice_Passes()
        => Validator.ValidateCommand(Valid(price: 100m, compareAt: 120m)).ShouldBeValid();

    [Fact]
    public void NegativeQuantity_Fails()
        => Validator.ValidateCommand(Valid(quantity: -1)).ShouldHaveErrorFor("Quantity");
}

public class CreatePromoCodeCommandValidatorTests
{
    private static readonly CreatePromoCodeCommandValidator Validator = new();

    private static CreatePromoCodeCommand Valid(
        string code = "SUMMER20",
        string discountType = "Percentage",
        decimal value = 20m,
        decimal? minOrder = null,
        decimal? maxDiscount = null,
        DateTime? startsAt = null,
        DateTime? expiresAt = null,
        int? usageLimit = null,
        int? perCustomer = null)
        => new(
            StoreId: StoreId.New(),
            Code: code,
            Description: null,
            DiscountType: discountType,
            Value: value,
            MinimumOrderAmount: minOrder,
            MaxDiscountAmount: maxDiscount,
            StartsAt: startsAt,
            ExpiresAt: expiresAt,
            UsageLimit: usageLimit,
            UsageLimitPerCustomer: perCustomer);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyCode_Fails()
        => Validator.ValidateCommand(Valid(code: "")).ShouldHaveErrorFor("Code");

    [Fact]
    public void UnknownDiscountType_Fails()
        => Validator.ValidateCommand(Valid(discountType: "BuyOneGetOne")).ShouldHaveErrorFor("DiscountType");

    [Fact]
    public void PercentageOver100_Fails()
        => Validator.ValidateCommand(Valid(discountType: "Percentage", value: 150m)).ShouldHaveErrorFor("Value");

    [Fact]
    public void NonPositiveValue_ForNonFreeShipping_Fails()
        => Validator.ValidateCommand(Valid(discountType: "FixedAmount", value: 0m)).ShouldHaveErrorFor("Value");

    [Fact]
    public void FreeShipping_AllowsZeroValue()
        => Validator.ValidateCommand(Valid(discountType: "FreeShipping", value: 0m)).ShouldBeValid();

    [Fact]
    public void ExpiryBeforeStart_Fails()
    {
        var start = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var cmd = Valid(startsAt: start, expiresAt: start.AddDays(-1));

        Validator.ValidateCommand(cmd).ShouldHaveErrorFor("ExpiresAt");
    }

    [Fact]
    public void ZeroUsageLimit_Fails()
        => Validator.ValidateCommand(Valid(usageLimit: 0)).ShouldHaveErrorFor("UsageLimit");
}
