namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct MerchantId(Guid Value)
{
    public static MerchantId New() => new(Guid.NewGuid());
    public static MerchantId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
