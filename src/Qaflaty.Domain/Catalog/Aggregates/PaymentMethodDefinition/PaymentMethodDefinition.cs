namespace Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;

/// <summary>
/// Represents a supported payment method that merchants can enable for their stores.
/// Stored in the database so new methods can be added without code changes.
/// </summary>
public sealed class PaymentMethodDefinition
{
    public int Id { get; private set; }

    /// <summary>Stable string key used across the system, e.g. "COD", "Visa".</summary>
    public string Key { get; private set; } = null!;

    public string DefaultLabel { get; private set; } = null!;
    public string DefaultDescription { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }

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
