namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct WishlistId(Guid Value)
{
    public static WishlistId New() => new(Guid.NewGuid());
    public static WishlistId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
