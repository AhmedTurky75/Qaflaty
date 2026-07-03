using Qaflaty.Domain.Catalog.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Catalog;

public class NamesAndSlugsTests
{
    // ---------- ProductName (bilingual) ----------

    [Fact]
    public void ProductName_EnglishOnly_ArabicFallsBackToEnglish()
    {
        var name = ProductName.Create("Blue Shirt").Value;

        Assert.Equal("Blue Shirt", name.English);
        Assert.Equal("Blue Shirt", name.Arabic);
        Assert.Equal("Blue Shirt", name.Value); // back-compat accessor
    }

    [Fact]
    public void ProductName_WithArabic_KeepsBoth_AndGetTextResolves()
    {
        var name = ProductName.Create("Blue Shirt", "قميص أزرق").Value;

        Assert.Equal("قميص أزرق", name.Arabic);
        Assert.Equal("قميص أزرق", name.GetText("ar"));
        Assert.Equal("Blue Shirt", name.GetText("en"));
        Assert.Equal("Blue Shirt", name.GetText("fr")); // non-ar => English
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ProductName_BlankEnglish_Fails(string? english)
    {
        var result = ProductName.Create(english!);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.NameRequired", result.Error.Code);
    }

    [Fact]
    public void ProductName_TooLong_Fails()
    {
        var result = ProductName.Create(new string('a', ProductName.MaxLength + 1));

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.NameTooLong", result.Error.Code);
    }

    // ---------- CategoryName (bilingual) ----------

    [Fact]
    public void CategoryName_WithArabic_ResolvesByLanguage()
    {
        var name = CategoryName.Create("Shoes", "أحذية").Value;

        Assert.Equal("أحذية", name.GetText("ar"));
        Assert.Equal("Shoes", name.GetText("en"));
    }

    [Fact]
    public void CategoryName_BlankEnglish_Fails()
    {
        var result = CategoryName.Create("  ");

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.NameRequired", result.Error.Code);
    }

    // ---------- ProductSlug ----------

    [Theory]
    [InlineData("blue-cotton-tshirt")]
    [InlineData("abc")]
    [InlineData("Blue-Cotton-01", "blue-cotton-01")] // uppercased normalized to lowercase
    public void ProductSlug_Valid_NormalizesLowercase(string input, string? expected = null)
    {
        var result = ProductSlug.Create(input);

        Assert.True(result.IsSuccess);
        Assert.Equal(expected ?? input, result.Value.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData("ab")]              // too short (< 3)
    [InlineData("has space")]
    [InlineData("under_score")]
    [InlineData("slash/slug")]
    public void ProductSlug_Invalid_Fails(string input)
    {
        var result = ProductSlug.Create(input);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.InvalidSlugFormat", result.Error.Code);
    }

    // ---------- CategorySlug ----------

    [Theory]
    [InlineData("ab")]     // 2 chars is valid for categories (min 2)
    [InlineData("mens-shoes")]
    public void CategorySlug_Valid_Succeeds(string input)
    {
        Assert.True(CategorySlug.Create(input).IsSuccess);
    }

    [Theory]
    [InlineData("a")]      // too short (< 2)
    [InlineData("Bad Slug")]
    public void CategorySlug_Invalid_Fails(string input)
    {
        var result = CategorySlug.Create(input);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.InvalidSlugFormat", result.Error.Code);
    }
}
