namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct PromoCodeId(Guid Value)
{
    public static PromoCodeId New() => new(Guid.NewGuid());
    public static PromoCodeId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
