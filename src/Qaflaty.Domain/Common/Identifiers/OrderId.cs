namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct OrderId(Guid Value)
{
    public static OrderId New() => new(Guid.NewGuid());
    public static OrderId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
