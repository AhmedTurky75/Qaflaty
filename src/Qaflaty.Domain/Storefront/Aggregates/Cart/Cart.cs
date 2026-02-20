using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Cart;

public sealed class Cart : AggregateRoot<CartId>
{
    public StoreCustomerId? CustomerId { get; private set; }
    public string? GuestId { get; private set; }
    public StoreId? StoreId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<CartItem> _items = [];
    public IReadOnlyList<CartItem> Items => _items.AsReadOnly();

    public int TotalItems => _items.Sum(i => i.Quantity);
    public bool IsGuestCart => GuestId != null;

    private Cart() : base(CartId.Empty) { }

    public static Result<Cart> CreateForCustomer(StoreCustomerId customerId, StoreId? storeId = null)
    {
        var cart = new Cart
        {
            Id = CartId.New(),
            CustomerId = customerId,
            StoreId = storeId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return Result<Cart>.Success(cart);
    }

    public static Result<Cart> CreateForGuest(string guestId, StoreId storeId)
    {
        if (string.IsNullOrWhiteSpace(guestId))
            return Result.Failure<Cart>(new Error("Cart.InvalidGuestId", "Guest ID cannot be empty"));

        var cart = new Cart
        {
            Id = CartId.New(),
            GuestId = guestId,
            StoreId = storeId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return Result<Cart>.Success(cart);
    }

    /// <summary>Keep for backward compatibility with existing callers.</summary>
    public static Result<Cart> Create(StoreCustomerId customerId) => CreateForCustomer(customerId);

    public Result AddItem(ProductId productId, int quantity, Guid? variantId = null)
    {
        if (quantity <= 0)
            return Result.Failure(new Error("Cart.InvalidQuantity",
                "Quantity must be greater than zero"));

        // Check if item already exists
        var existingItem = _items.FirstOrDefault(i =>
            i.ProductId == productId &&
            i.VariantId == variantId);

        if (existingItem != null)
        {
            // Update quantity
            existingItem.IncrementQuantity(quantity);
        }
        else
        {
            // Add new item
            var item = CartItem.Create(Id, productId, quantity, variantId);
            _items.Add(item);
        }

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateItemQuantity(ProductId productId, int quantity, Guid? variantId = null)
    {
        if (quantity <= 0)
            return Result.Failure(new Error("Cart.InvalidQuantity",
                "Quantity must be greater than zero"));

        var item = _items.FirstOrDefault(i =>
            i.ProductId == productId &&
            i.VariantId == variantId);

        if (item == null)
            return Result.Failure(new Error("Cart.ItemNotFound",
                "Item not found in cart"));

        item.UpdateQuantity(quantity);
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }

    public Result RemoveItem(ProductId productId, Guid? variantId = null)
    {
        var item = _items.FirstOrDefault(i =>
            i.ProductId == productId &&
            i.VariantId == variantId);

        if (item == null)
            return Result.Failure(new Error("Cart.ItemNotFound",
                "Item not found in cart"));

        _items.Remove(item);
        UpdatedAt = DateTime.UtcNow;

        return Result.Success();
    }

    public void ClearAll()
    {
        _items.Clear();
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Merges guest cart items into this cart (used during login sync)
    /// </summary>
    public Result MergeGuestCart(List<(ProductId ProductId, Guid? VariantId, int Quantity)> guestItems)
    {
        foreach (var (productId, variantId, quantity) in guestItems)
        {
            // Check if item already exists in server cart
            var existingItem = _items.FirstOrDefault(i =>
                i.ProductId == productId &&
                i.VariantId == variantId);

            if (existingItem != null)
            {
                // Add quantities together
                existingItem.IncrementQuantity(quantity);
            }
            else
            {
                // Add new item from guest cart
                var item = CartItem.Create(Id, productId, quantity, variantId);
                _items.Add(item);
            }
        }

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
