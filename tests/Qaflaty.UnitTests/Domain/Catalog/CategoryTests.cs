using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Catalog;

public class CategoryTests
{
    private static Category NewCategory() =>
        Category.Create(
            StoreId.New(),
            CategoryName.Create("Shoes").Value,
            CategorySlug.Create("shoes").Value).Value;

    [Fact]
    public void Create_TopLevel_HasNoParent()
    {
        var category = NewCategory();

        Assert.Null(category.ParentId);
        Assert.Equal(0, category.SortOrder);
    }

    [Fact]
    public void SetParent_ToSelf_Fails()
    {
        var category = NewCategory();

        var result = category.SetParent(category.Id);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.CannotBeOwnParent", result.Error.Code);
        Assert.Null(category.ParentId);
    }

    [Fact]
    public void SetParent_ToOtherCategory_Succeeds()
    {
        var category = NewCategory();
        var parentId = CategoryId.New();

        var result = category.SetParent(parentId);

        Assert.True(result.IsSuccess);
        Assert.Equal(parentId, category.ParentId);
    }

    [Fact]
    public void UpdateSortOrder_ChangesValue()
    {
        var category = NewCategory();

        category.UpdateSortOrder(7);

        Assert.Equal(7, category.SortOrder);
    }

    [Fact]
    public void Create_WithoutMedia_LeavesImageAndIconNull()
    {
        var category = NewCategory();

        Assert.Null(category.ImageUrl);
        Assert.Null(category.IconName);
        Assert.Null(category.Content);
    }

    [Fact]
    public void UpdateMedia_TrimsAndStoresValues()
    {
        var category = NewCategory();

        var result = category.UpdateMedia("  /uploads/shoes.png  ", "  shirt  ");

        Assert.True(result.IsSuccess);
        Assert.Equal("/uploads/shoes.png", category.ImageUrl);
        Assert.Equal("shirt", category.IconName);
    }

    [Fact]
    public void UpdateMedia_WithBlankValues_ClearsThem()
    {
        var category = NewCategory();
        category.UpdateMedia("/uploads/shoes.png", "shirt");

        category.UpdateMedia("   ", null);

        Assert.Null(category.ImageUrl);
        Assert.Null(category.IconName);
    }

    [Fact]
    public void UpdateMedia_WithOverlongImageUrl_Fails()
    {
        var category = NewCategory();

        var result = category.UpdateMedia(new string('a', Category.MaxImageUrlLength + 1), null);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.CategoryImageUrlTooLong", result.Error.Code);
    }

    [Fact]
    public void UpdateContent_StoresBilingualHtml()
    {
        var category = NewCategory();
        var content = CategoryContent.Create("<p>Shoes</p>", "<p>أحذية</p>").Value;

        category.UpdateContent(content);

        Assert.NotNull(category.Content);
        Assert.Equal("<p>Shoes</p>", category.Content!.GetHtml("en"));
        Assert.Equal("<p>أحذية</p>", category.Content.GetHtml("ar"));
    }

    [Fact]
    public void UpdateContent_WithNull_ClearsTheBlock()
    {
        var category = NewCategory();
        category.UpdateContent(CategoryContent.Create("<p>Shoes</p>").Value);

        category.UpdateContent(null);

        Assert.Null(category.Content);
    }

    [Fact]
    public void CategoryContent_WithBothLanguagesBlank_IsNull()
    {
        var result = CategoryContent.Create("  ", null);

        Assert.True(result.IsSuccess);
        Assert.Null(result.Value);
    }

    [Fact]
    public void CategoryContent_WithOnlyEnglish_FallsBackForArabic()
    {
        var content = CategoryContent.Create("<p>Shoes</p>").Value;

        Assert.NotNull(content);
        Assert.Equal("<p>Shoes</p>", content!.GetHtml("ar"));
    }

    [Fact]
    public void CategoryContent_TooLong_Fails()
    {
        var result = CategoryContent.Create(new string('a', CategoryContent.MaxLength + 1));

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.CategoryContentTooLong", result.Error.Code);
    }
}
