using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.DeliveryZone;

/// <summary>
/// Represents the delivery configuration for a specific geographic zone (country, city, or district) within a store.
/// Zone resolution order: District → City → Country → Store default.
/// If <see cref="IsDeliveryEnabled"/> is false, delivery to this zone is rejected at order placement.
/// </summary>
public sealed class DeliveryZone : AggregateRoot<DeliveryZoneId>
{
    public StoreId StoreId { get; private set; } // Store this delivery zone configuration belongs to

    /// <summary>Level of this zone node.</summary>
    public DeliveryZoneLevel Level { get; private set; } // Geographic granularity of the zone: Country / City / District

    /// <summary>
    /// The ID of the geographic entity at this level.
    /// For Country: Country.Id, for City: City.Id, for District: District.Id.
    /// </summary>
    public int ReferenceId { get; private set; } // Id of the geographic entity at this Level (Country.Id / City.Id / District.Id)

    /// <summary>Whether delivery is available to this zone.</summary>
    public bool IsDeliveryEnabled { get; private set; } // When false, orders shipping to this zone are rejected

    /// <summary>
    /// Optional custom delivery fee. When null, the parent zone's fee (or store default) applies.
    /// </summary>
    public decimal? CustomDeliveryFee { get; private set; } // Zone-specific override fee; null falls back to parent zone / store default, e.g. 25.00

    /// <summary>Currency for the custom fee (ISO 4217, e.g. "SAR", "EGP").</summary>
    public string? FeeCurrency { get; private set; } // ISO 4217 currency of CustomDeliveryFee, e.g. "SAR"

    public DateTime CreatedAt { get; private set; } // UTC timestamp when the zone was created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last change

    private DeliveryZone() : base(DeliveryZoneId.Empty) { }

    public static Result<DeliveryZone> Create(
        StoreId storeId,
        DeliveryZoneLevel level,
        int referenceId,
        bool isDeliveryEnabled = true,
        decimal? customDeliveryFee = null,
        string? feeCurrency = null)
    {
        if (customDeliveryFee.HasValue && customDeliveryFee.Value < 0)
            return Result.Failure<DeliveryZone>(
                new Error("DeliveryZone.NegativeFee", "Custom delivery fee cannot be negative"));

        return Result.Success(new DeliveryZone
        {
            Id = DeliveryZoneId.New(),
            StoreId = storeId,
            Level = level,
            ReferenceId = referenceId,
            IsDeliveryEnabled = isDeliveryEnabled,
            CustomDeliveryFee = customDeliveryFee,
            FeeCurrency = feeCurrency,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
    }

    public Result Update(bool isDeliveryEnabled, decimal? customDeliveryFee, string? feeCurrency)
    {
        if (customDeliveryFee.HasValue && customDeliveryFee.Value < 0)
            return Result.Failure(
                new Error("DeliveryZone.NegativeFee", "Custom delivery fee cannot be negative"));

        IsDeliveryEnabled = isDeliveryEnabled;
        CustomDeliveryFee = customDeliveryFee;
        FeeCurrency = feeCurrency;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
