namespace Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;

/// <summary>
/// Represents a supported payment method that merchants can enable for their stores.
/// Stored in the database so new methods can be added without code changes.
/// </summary>
public sealed class PaymentMethodDefinition
{
    public int Id { get; private set; } // Numeric primary key of the payment method (seeded reference data)

    /// <summary>Stable string key used across the system, e.g. "COD", "Visa".</summary>
    public string Key { get; private set; } = null!; // Stable code matched against PaymentMethodAdjustment.PaymentMethodKey, e.g. "COD"

    public string DefaultLabel { get; private set; } = null!; // Default display name shown at checkout, e.g. "Cash on Delivery"
    public string DefaultDescription { get; private set; } = string.Empty; // Default helper text describing the method
    public bool IsActive { get; private set; } // Whether the method is globally available to be enabled by merchants
    public int SortOrder { get; private set; } // Display order among payment methods (lower = first)

    private PaymentMethodDefinition() { }

    public static PaymentMethodDefinition Create(
        int id, string key, string defaultLabel, string defaultDescription, int sortOrder) =>
        new()
        {
            Id = id,
            Key = key,
            DefaultLabel = defaultLabel,
            DefaultDescription = defaultDescription,
            IsActive = true,
            SortOrder = sortOrder
        };
}
