using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Wishlist;

public sealed class Wishlist : AggregateRoot<WishlistId>
{
    public StoreCustomerId CustomerId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<WishlistItem> _items = [];
    public IReadOnlyList<WishlistItem> Items => _items.AsReadOnly();

    private Wishlist() : base(WishlistId.Empty) { }

    public static Result<Wishlist> Create(StoreCustomerId customerId)
    {
        var wishlist = new Wishlist
        {
            Id = WishlistId.New(),
            CustomerId = customerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return Result<Wishlist>.Success(wishlist);
    }

    public Result AddItem(ProductId productId, Guid? variantId = null)
    {
        // Check if item already exists
        var existingItem = _items.FirstOrDefault(i =>
            i.ProductId == productId &&
            i.VariantId == variantId);

        if (existingItem != null)
            return Result.Failure(new Error("Wishlist.ItemAlreadyExists",
                "Item is already in the wishlist"));

        var item = WishlistItem.Create(Id, productId, variantId);
        _items.Add(item);
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }

    public Result RemoveItem(ProductId productId, Guid? variantId = null)
    {
        var item = _items.FirstOrDefault(i =>
            i.ProductId == productId &&
            i.VariantId == variantId);

        if (item == null)
            return Result.Failure(new Error("Wishlist.ItemNotFound",
                "Item not found in wishlist"));

        _items.Remove(item);
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }

    public void ClearAll()
    {
        _items.Clear();
        UpdatedAt = DateTime.UtcNow;
    }

    public bool ContainsItem(ProductId productId, Guid? variantId = null)
    {
        return _items.Any(i => i.ProductId == productId && i.VariantId == variantId);
    }
}
