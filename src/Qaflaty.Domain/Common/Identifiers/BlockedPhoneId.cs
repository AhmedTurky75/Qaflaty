namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct BlockedPhoneId(Guid Value)
{
    public static BlockedPhoneId New() => new(Guid.NewGuid());
    public static BlockedPhoneId Empty => new(Guid.Empty);
    public override string ToString() => Value.ToString();
}
