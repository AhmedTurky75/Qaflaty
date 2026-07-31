namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct TrackingEventId(Guid Value)
{
    public static TrackingEventId New() => new(Guid.NewGuid());
    public static TrackingEventId Empty => new(Guid.Empty);
    public static TrackingEventId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
