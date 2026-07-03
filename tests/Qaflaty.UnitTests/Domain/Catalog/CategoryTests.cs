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
}
