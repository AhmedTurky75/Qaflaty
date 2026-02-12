namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct StoreCustomerId(Guid Value)
{
    public static StoreCustomerId New() => new(Guid.NewGuid());
    public static StoreCustomerId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
