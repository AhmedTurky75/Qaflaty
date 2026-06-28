using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ordering.ValueObjects;

/// <summary>
/// Carrier and tracking details captured when an order is shipped. All fields are optional so a
/// merchant can ship with or without a tracking number.
/// </summary>
public sealed class ShipmentInfo : ValueObject
{
    public string? Carrier { get; private set; }
    public string? TrackingNumber { get; private set; }
    public string? TrackingUrl { get; private set; }
    public DateTime ShippedAt { get; private set; }
    public DateTime? EstimatedDeliveryDate { get; private set; }

    private ShipmentInfo() { }

    private ShipmentInfo(
        string? carrier, string? trackingNumber, string? trackingUrl,
        DateTime shippedAt, DateTime? estimatedDeliveryDate)
    {
        Carrier = carrier;
        TrackingNumber = trackingNumber;
        TrackingUrl = trackingUrl;
        ShippedAt = shippedAt;
        EstimatedDeliveryDate = estimatedDeliveryDate;
    }

    public static ShipmentInfo Create(
        string? carrier = null,
        string? trackingNumber = null,
        string? trackingUrl = null,
        DateTime? estimatedDeliveryDate = null)
        => new(
            Trim(carrier),
            Trim(trackingNumber),
            Trim(trackingUrl),
            DateTime.UtcNow,
            estimatedDeliveryDate);

    private static string? Trim(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Carrier;
        yield return TrackingNumber;
        yield return TrackingUrl;
        yield return ShippedAt;
        yield return EstimatedDeliveryDate;
    }
}
