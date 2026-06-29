namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct PromoCodeRedemptionId(Guid Value)
{
    public static PromoCodeRedemptionId New() => new(Guid.NewGuid());
    public static PromoCodeRedemptionId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
