using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class ProductInventory : ValueObject
{
    public int Quantity { get; private set; }
    public string? Sku { get; }
    public bool TrackInventory { get; }

    public bool InStock => !TrackInventory || Quantity > 0;
    public bool LowStock => TrackInventory && Quantity > 0 && Quantity <= 5;

    private ProductInventory(int quantity, string? sku, bool trackInventory)
    {
        Quantity = quantity;
        Sku = sku;
        TrackInventory = trackInventory;
    }

    public static Result<ProductInventory> Create(int quantity, string? sku = null, bool trackInventory = true)
    {
        if (quantity < 0)
            return Result.Failure<ProductInventory>(CatalogErrors.StockCannotBeNegative);

        return Result.Success(new ProductInventory(quantity, sku, trackInventory));
    }

    public Result Reserve(int quantity)
    {
        if (!TrackInventory)
            return Result.Success();

        if (Quantity < quantity)
            return Result.Failure(CatalogErrors.InsufficientStock);

        Quantity -= quantity;
        return Result.Success();
    }

    public Result Restock(int quantity)
    {
        if (quantity < 0)
            return Result.Failure(CatalogErrors.StockCannotBeNegative);

        Quantity += quantity;
        return Result.Success();
    }

    public bool CanFulfill(int quantity) => !TrackInventory || Quantity >= quantity;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Quantity;
        yield return Sku;
        yield return TrackInventory;
    }
}
