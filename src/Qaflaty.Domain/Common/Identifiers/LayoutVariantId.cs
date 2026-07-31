namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct LayoutVariantId(Guid Value)
{
    public static LayoutVariantId New() => new(Guid.NewGuid());
    public static LayoutVariantId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
