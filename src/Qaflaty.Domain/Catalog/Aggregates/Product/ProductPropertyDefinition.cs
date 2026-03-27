using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product;

/// <summary>
/// Store-level template that defines a custom property merchants can attach to their products.
/// </summary>
public sealed class ProductPropertyDefinition : AggregateRoot<ProductPropertyDefinitionId>
{
    public StoreId StoreId { get; private set; }

    /// <summary>Internal machine-readable key, e.g. "material".</summary>
    public string Name { get; private set; } = null!;

    /// <summary>Human-readable label shown on the storefront, e.g. "Material".</summary>
    public string DisplayName { get; private set; } = null!;

    public ProductPropertyType Type { get; private set; }

    /// <summary>Allowed options for SingleChoice / MultiChoice types. Empty for other types.</summary>
    public List<string> Options { get; private set; } = [];

    public bool IsRequired { get; private set; }

    /// <summary>When true, this property appears as a filter option in storefront search.</summary>
    public bool IsFilterable { get; private set; }

    public int SortOrder { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ProductPropertyDefinition() : base(ProductPropertyDefinitionId.Empty) { }

    public static Result<ProductPropertyDefinition> Create(
        StoreId storeId,
        string name,
        string displayName,
        ProductPropertyType type,
        List<string>? options = null,
        bool isRequired = false,
        bool isFilterable = false,
        int sortOrder = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result.Failure<ProductPropertyDefinition>(
                new Error("ProductProperty.NameRequired", "Property name is required"));

        if (string.IsNullOrWhiteSpace(displayName))
            return Result.Failure<ProductPropertyDefinition>(
                new Error("ProductProperty.DisplayNameRequired", "Property display name is required"));

        var choiceTypes = new[] { ProductPropertyType.SingleChoice, ProductPropertyType.MultiChoice };
        if (choiceTypes.Contains(type) && (options == null || options.Count == 0))
            return Result.Failure<ProductPropertyDefinition>(
                new Error("ProductProperty.OptionsRequired",
                    "Options are required for SingleChoice and MultiChoice property types"));

        return Result.Success(new ProductPropertyDefinition
        {
            Id = ProductPropertyDefinitionId.New(),
            StoreId = storeId,
            Name = name.Trim().ToLowerInvariant(),
            DisplayName = displayName.Trim(),
            Type = type,
            Options = options ?? [],
            IsRequired = isRequired,
            IsFilterable = isFilterable,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
    }

    public Result Update(
        string displayName,
        List<string>? options,
        bool isRequired,
        bool isFilterable,
        int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            return Result.Failure(
                new Error("ProductProperty.DisplayNameRequired", "Property display name is required"));

        var choiceTypes = new[] { ProductPropertyType.SingleChoice, ProductPropertyType.MultiChoice };
        if (choiceTypes.Contains(Type) && (options == null || options.Count == 0))
            return Result.Failure(
                new Error("ProductProperty.OptionsRequired",
                    "Options are required for SingleChoice and MultiChoice property types"));

        DisplayName = displayName.Trim();
        Options = options ?? [];
        IsRequired = isRequired;
        IsFilterable = isFilterable;
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
