namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct CategoryId(Guid Value)
{
    public static CategoryId New() => new(Guid.NewGuid());
    public static CategoryId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
