namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct DeliveryZoneId(Guid Value)
{
    public static DeliveryZoneId New() => new(Guid.NewGuid());
    public static DeliveryZoneId Empty => new(Guid.Empty);
    public static DeliveryZoneId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
