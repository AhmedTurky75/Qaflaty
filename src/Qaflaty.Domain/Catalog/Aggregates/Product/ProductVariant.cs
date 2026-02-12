using System.Text.Json;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Catalog.Aggregates.Product;

/// <summary>
/// Represents a specific variant of a product (e.g., "Red T-Shirt, Size M")
/// </summary>
public sealed class ProductVariant : Entity<Guid>
{
    public ProductId ProductId { get; private set; }

    /// <summary>
    /// Variant attributes as key-value pairs (e.g., {"Color": "Red", "Size": "M"})
    /// Stored as JSONB in database for flexibility
    /// </summary>
    public Dictionary<string, string> Attributes { get; private set; } = new();

    public string Sku { get; private set; } = string.Empty;

    /// <summary>
    /// Price override for this variant. If null, uses product base price
    /// </summary>
    public Money? PriceOverride { get; private set; }

    public int Quantity { get; private set; }
    public bool AllowBackorder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ProductVariant() : base(Guid.Empty) { }

    public static Result<ProductVariant> Create(
        ProductId productId,
        Dictionary<string, string> attributes,
        string sku,
        Money? priceOverride,
        int quantity,
        bool allowBackorder)
    {
        if (attributes == null || attributes.Count == 0)
            return Result.Failure<ProductVariant>(
                new Error("ProductVariant.AttributesRequired", "Variant must have at least one attribute"));

        if (string.IsNullOrWhiteSpace(sku))
            return Result.Failure<ProductVariant>(
                new Error("ProductVariant.SkuRequired", "SKU is required"));

        if (quantity < 0)
            return Result.Failure<ProductVariant>(
                new Error("ProductVariant.InvalidQuantity", "Quantity cannot be negative"));

        return Result.Success(new ProductVariant
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            Attributes = attributes,
            Sku = sku.Trim(),
            PriceOverride = priceOverride,
            Quantity = quantity,
            AllowBackorder = allowBackorder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
    }

    public Result UpdateInfo(string sku, Money? priceOverride, bool allowBackorder)
    {
        if (string.IsNullOrWhiteSpace(sku))
            return Result.Failure(new Error("ProductVariant.SkuRequired", "SKU is required"));

        Sku = sku.Trim();
        PriceOverride = priceOverride;
        AllowBackorder = allowBackorder;
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }

    public Result ReserveStock(int quantity)
    {
        if (Quantity < quantity && !AllowBackorder)
            return Result.Failure(
                new Error("ProductVariant.InsufficientStock",
                    $"Insufficient stock for variant SKU {Sku}. Available: {Quantity}, Requested: {quantity}"));

        Quantity -= quantity;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result AdjustStock(int quantity, string reason)
    {
        var newQuantity = Quantity + quantity;

        if (newQuantity < 0)
            return Result.Failure(
                new Error("ProductVariant.InvalidStockAdjustment",
                    "Stock adjustment would result in negative quantity"));

        Quantity = newQuantity;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public string GetAttributesDisplayString()
    {
        return string.Join(", ", Attributes.Select(kvp => $"{kvp.Key}: {kvp.Value}"));
    }
}
