namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct StoreId(Guid Value)
{
    public static StoreId New() => new(Guid.NewGuid());
    public static StoreId Empty => new(Guid.Empty);
    public static StoreId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
