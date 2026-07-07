namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct PageVariantId(Guid Value)
{
    public static PageVariantId New() => new(Guid.NewGuid());
    public static PageVariantId Empty => new(Guid.Empty);
    public static PageVariantId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
