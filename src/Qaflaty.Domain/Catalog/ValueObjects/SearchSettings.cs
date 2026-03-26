using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class SearchSettings : ValueObject
{
    public bool EnableTextSearch { get; private set; }
    public bool EnableCategoryFilter { get; private set; }
    public bool EnablePriceFilter { get; private set; }
    public bool EnablePropertyFilters { get; private set; }

    /// <summary>
    /// IDs of ProductPropertyDefinitions that should appear as filters in the storefront.
    /// Stored as a JSON array in the database.
    /// </summary>
    public List<Guid> FilterablePropertyDefinitionIds { get; private set; } = [];

    /// <summary>Sort options available to customers on the storefront product listing.</summary>
    public List<ProductSortOption> AllowedSortOptions { get; private set; } = [];

    private SearchSettings() { }

    public static SearchSettings CreateDefault() => new()
    {
        EnableTextSearch = true,
        EnableCategoryFilter = true,
        EnablePriceFilter = true,
        EnablePropertyFilters = false,
        FilterablePropertyDefinitionIds = [],
        AllowedSortOptions = [ProductSortOption.Newest, ProductSortOption.PriceAsc, ProductSortOption.PriceDesc]
    };

    public static SearchSettings Create(
        bool enableTextSearch,
        bool enableCategoryFilter,
        bool enablePriceFilter,
        bool enablePropertyFilters,
        List<Guid> filterablePropertyDefinitionIds,
        List<ProductSortOption> allowedSortOptions) => new()
    {
        EnableTextSearch = enableTextSearch,
        EnableCategoryFilter = enableCategoryFilter,
        EnablePriceFilter = enablePriceFilter,
        EnablePropertyFilters = enablePropertyFilters,
        FilterablePropertyDefinitionIds = filterablePropertyDefinitionIds,
        AllowedSortOptions = allowedSortOptions
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return EnableTextSearch;
        yield return EnableCategoryFilter;
        yield return EnablePriceFilter;
        yield return EnablePropertyFilters;
        yield return string.Join(",", FilterablePropertyDefinitionIds.OrderBy(x => x));
        yield return string.Join(",", AllowedSortOptions.OrderBy(x => x));
    }
}
