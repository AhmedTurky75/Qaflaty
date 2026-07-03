using Qaflaty.Application.Catalog.Commands.AddProductVariant;
using Qaflaty.Application.Catalog.Commands.AddVariantOption;
using Qaflaty.Application.Catalog.Commands.CreateCategory;
using Qaflaty.Application.Catalog.Commands.CreateCustomPage;
using Qaflaty.Application.Catalog.Commands.CreateFaqItem;
using Qaflaty.Application.Catalog.Commands.CreateStore;
using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class CreateCategoryCommandValidatorTests
{
    private static readonly CreateCategoryCommandValidator Validator = new();

    private static CreateCategoryCommand Valid(string name = "Shoes", string slug = "shoes", int sortOrder = 0)
        => new(Guid.NewGuid(), name, null, slug, null, sortOrder);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyStoreId_Fails()
        => Validator.ValidateCommand(Valid() with { StoreId = Guid.Empty }).ShouldHaveErrorFor("StoreId");

    [Theory]
    [InlineData("a")]        // too short (min 2)
    [InlineData("Bad Slug")]
    public void InvalidSlug_Fails(string slug)
        => Validator.ValidateCommand(Valid(slug: slug)).ShouldHaveErrorFor("Slug");

    [Fact]
    public void NegativeSortOrder_Fails()
        => Validator.ValidateCommand(Valid(sortOrder: -1)).ShouldHaveErrorFor("SortOrder");
}

public class CreateStoreCommandValidatorTests
{
    private static readonly CreateStoreCommandValidator Validator = new();

    private static CreateStoreCommand Valid(
        string slug = "my-store",
        string name = "My Store",
        string primaryColor = "#4F46E5",
        decimal deliveryFee = 10m,
        decimal? freeThreshold = null)
        => new(slug, name, PrimaryColor: primaryColor, DeliveryFee: deliveryFee, FreeDeliveryThreshold: freeThreshold);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Theory]
    [InlineData("ab")]        // too short
    [InlineData("1store")]    // must start with a letter
    [InlineData("My-Store")]  // uppercase not allowed
    [InlineData("store-")]    // must end alphanumeric
    public void InvalidSlug_Fails(string slug)
        => Validator.ValidateCommand(Valid(slug: slug)).ShouldHaveErrorFor("Slug");

    [Theory]
    [InlineData("red")]
    [InlineData("#FFF")]     // 3 digits, needs 6
    public void InvalidHexColor_Fails(string color)
        => Validator.ValidateCommand(Valid(primaryColor: color)).ShouldHaveErrorFor("PrimaryColor");

    [Fact]
    public void NegativeDeliveryFee_Fails()
        => Validator.ValidateCommand(Valid(deliveryFee: -1m)).ShouldHaveErrorFor("DeliveryFee");

    [Fact]
    public void FreeThresholdBelowDeliveryFee_Fails()
        => Validator.ValidateCommand(Valid(deliveryFee: 20m, freeThreshold: 10m)).ShouldHaveErrorFor("FreeDeliveryThreshold");

    [Fact]
    public void FreeThresholdAboveDeliveryFee_Passes()
        => Validator.ValidateCommand(Valid(deliveryFee: 20m, freeThreshold: 200m)).ShouldBeValid();
}

public class AddProductVariantCommandValidatorTests
{
    private static readonly AddProductVariantCommandValidator Validator = new();

    private static AddProductVariantCommand Valid(
        string sku = "SKU-1",
        int quantity = 5,
        decimal? priceOverride = null,
        Dictionary<string, string>? attributes = null)
        => new(ProductId.New(), attributes ?? new() { ["Color"] = "Red" }, sku, priceOverride, null, quantity, false);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyAttributes_Fails()
        => Validator.ValidateCommand(Valid(attributes: new())).ShouldHaveErrorFor("Attributes");

    [Fact]
    public void EmptySku_Fails()
        => Validator.ValidateCommand(Valid(sku: "")).ShouldHaveErrorFor("Sku");

    [Fact]
    public void NegativeQuantity_Fails()
        => Validator.ValidateCommand(Valid(quantity: -1)).ShouldHaveErrorFor("Quantity");

    [Fact]
    public void NonPositivePriceOverride_Fails()
        => Validator.ValidateCommand(Valid(priceOverride: 0m)).ShouldHaveErrorFor("PriceOverride");
}

public class AddVariantOptionCommandValidatorTests
{
    private static readonly AddVariantOptionCommandValidator Validator = new();

    [Fact]
    public void Valid_Passes()
        => Validator.ValidateCommand(new AddVariantOptionCommand(ProductId.New(), "Color", ["Red", "Blue"])).ShouldBeValid();

    [Fact]
    public void EmptyOptionName_Fails()
        => Validator.ValidateCommand(new AddVariantOptionCommand(ProductId.New(), "", ["Red"])).ShouldHaveErrorFor("OptionName");

    [Fact]
    public void EmptyValues_Fails()
        => Validator.ValidateCommand(new AddVariantOptionCommand(ProductId.New(), "Color", [])).ShouldHaveErrorFor("OptionValues");
}

public class CreateFaqItemCommandValidatorTests
{
    private static readonly CreateFaqItemCommandValidator Validator = new();

    private static CreateFaqItemCommand Valid(
        string qAr = "سؤال", string qEn = "Question", string aAr = "جواب", string aEn = "Answer")
        => new(Guid.NewGuid(), new BilingualTextDto(qAr, qEn), new BilingualTextDto(aAr, aEn), true);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyArabicQuestion_Fails()
        => Validator.ValidateCommand(Valid(qAr: "")).ShouldHaveErrorFor("Question.Arabic");

    [Fact]
    public void EmptyEnglishAnswer_Fails()
        => Validator.ValidateCommand(Valid(aEn: "")).ShouldHaveErrorFor("Answer.English");
}

public class CreateCustomPageCommandValidatorTests
{
    private static readonly CreateCustomPageCommandValidator Validator = new();

    private static CreateCustomPageCommand Valid(string slug = "about-us", string titleEn = "About")
        => new(Guid.NewGuid(), new BilingualTextDto("عن", titleEn), slug, null);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyEnglishTitle_Fails()
        => Validator.ValidateCommand(Valid(titleEn: "")).ShouldHaveErrorFor("Title.English");

    [Theory]
    [InlineData("About Us")]  // space
    [InlineData("about_us")]  // underscore
    [InlineData("-about")]    // leading hyphen
    public void InvalidSlug_Fails(string slug)
        => Validator.ValidateCommand(Valid(slug: slug)).ShouldHaveErrorFor("Slug");
}
