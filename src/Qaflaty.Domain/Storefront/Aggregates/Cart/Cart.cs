using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Cart;

public sealed class Cart : AggregateRoot<CartId>
{
    public StoreCustomerId? CustomerId { get; private set; } // Owner customer for an authenticated cart; null for guest carts
    public string? GuestId { get; private set; } // Guest session id for an anonymous cart; null for authenticated carts (cart duality)
    public StoreId? StoreId { get; private set; } // Store the cart belongs to
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the cart was created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last cart change (used to expire stale guest carts)

    private readonly List<CartItem> _items = []; // Backing list of cart line items
    public IReadOnlyList<CartItem> Items => _items.AsReadOnly(); // Products (and chosen variants) currently in the cart

    public int TotalItems => _items.Sum(i => i.Quantity); // Total unit count across all line items (for the cart badge)
    public bool IsGuestCart => GuestId != null; // True when this is an anonymous/guest cart

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
