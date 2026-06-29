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
    public StoreId StoreId { get; private set; } // Store that owns this custom property template

    /// <summary>Internal machine-readable key, e.g. "material".</summary>
    public string Name { get; private set; } = null!; // Normalized lowercase key used in code/filters, e.g. "material"

    /// <summary>Human-readable label shown on the storefront, e.g. "Material".</summary>
    public string DisplayName { get; private set; } = null!; // Label shown to customers, e.g. "Material"

    public ProductPropertyType Type { get; private set; } // Data type of the property: Text / Number / Boolean / SingleChoice / MultiChoice

    /// <summary>Allowed options for SingleChoice / MultiChoice types. Empty for other types.</summary>
    public List<string> Options { get; private set; } = []; // Selectable values for choice types, e.g. ["Cotton","Wool","Silk"]

    public bool IsRequired { get; private set; } // Whether merchants must set this property when creating a product

    /// <summary>When true, this property appears as a filter option in storefront search.</summary>
    public bool IsFilterable { get; private set; } // Whether customers can filter the catalog by this property

    public int SortOrder { get; private set; } // Display order among property definitions (lower = first)

    public DateTime CreatedAt { get; private set; } // UTC timestamp when the definition was created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last change

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
