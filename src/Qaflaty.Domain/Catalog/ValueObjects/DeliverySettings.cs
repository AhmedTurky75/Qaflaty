using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class DeliverySettings : ValueObject
{
    public Money DeliveryFee { get; private set; } = null!; // Flat shipping fee charged per order, e.g. 15.00 SAR
    public Money? FreeDeliveryThreshold { get; private set; } // Order subtotal at/above which delivery becomes free; null disables free shipping, e.g. 200.00 SAR

    // EF Core requires parameterless constructor for types with owned navigations
    private DeliverySettings() { }

    private DeliverySettings(Money deliveryFee, Money? freeDeliveryThreshold)
    {
        DeliveryFee = deliveryFee;
        FreeDeliveryThreshold = freeDeliveryThreshold;
    }

    public static Result<DeliverySettings> Create(Money deliveryFee, Money? freeDeliveryThreshold = null)
    {
        if (freeDeliveryThreshold != null && freeDeliveryThreshold.Amount <= deliveryFee.Amount)
            return Result.Failure<DeliverySettings>(CatalogErrors.InvalidThreshold);

        return Result.Success(new DeliverySettings(deliveryFee, freeDeliveryThreshold));
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return DeliveryFee;
        yield return FreeDeliveryThreshold;
    }
}
