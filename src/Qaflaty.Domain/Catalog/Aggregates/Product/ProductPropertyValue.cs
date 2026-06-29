using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product;

/// <summary>
/// Holds the value of a custom property for a specific product.
/// Values are stored as strings and parsed by the application layer according to the property's Type.
/// </summary>
public sealed class ProductPropertyValue : Entity<Guid>
{
    public ProductId ProductId { get; private set; } // Product this property value is assigned to
    public ProductPropertyDefinitionId DefinitionId { get; private set; } // The property definition this value fills in (links to ProductPropertyDefinition)

    /// <summary>
    /// Serialized value string.
    /// - Text: plain string
    /// - Number: decimal string, e.g. "42.5"
    /// - Boolean: "true" or "false"
    /// - SingleChoice: one of the definition's option strings
    /// - MultiChoice: JSON array of option strings, e.g. ["Red","Blue"]
    /// </summary>
    public string Value { get; private set; } = null!;

    private ProductPropertyValue() : base(Guid.Empty) { }

    public static Result<ProductPropertyValue> Create(
        ProductId productId,
        ProductPropertyDefinitionId definitionId,
        string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Result.Failure<ProductPropertyValue>(
                new Error("ProductPropertyValue.ValueRequired", "Property value is required"));

        return Result.Success(new ProductPropertyValue
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            DefinitionId = definitionId,
            Value = value.Trim()
        });
    }

    public void UpdateValue(string value)
    {
        Value = value.Trim();
    }
}
