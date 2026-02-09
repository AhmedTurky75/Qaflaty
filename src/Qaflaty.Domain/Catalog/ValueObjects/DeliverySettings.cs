using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class DeliverySettings : ValueObject
{
    public Money DeliveryFee { get; private set; } = null!;
    public Money? FreeDeliveryThreshold { get; private set; }

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
