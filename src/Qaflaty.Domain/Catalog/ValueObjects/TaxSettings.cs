using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

/// <summary>
/// Per-store tax/VAT configuration. <see cref="Rate"/> is a percentage (e.g. 15 = 15%). When
/// <see cref="PricesIncludeTax"/> is true the catalog prices already contain tax and the tax portion
/// is shown for information; otherwise tax is added on top of the order.
/// </summary>
public sealed class TaxSettings : ValueObject
{
    public const int MaxLabelLength = 30;

    public bool Enabled { get; private set; }
    public decimal Rate { get; private set; }
    public bool PricesIncludeTax { get; private set; }
    public string Label { get; private set; } = "VAT";

    private TaxSettings() { }

    public static TaxSettings CreateDefault() => new()
    {
        Enabled = false,
        Rate = 0m,
        PricesIncludeTax = false,
        Label = "VAT"
    };

    public static TaxSettings Create(bool enabled, decimal rate, bool pricesIncludeTax, string? label)
    {
        if (rate < 0) rate = 0;
        if (rate > 100) rate = 100;

        var trimmed = string.IsNullOrWhiteSpace(label) ? "VAT" : label.Trim();
        if (trimmed.Length > MaxLabelLength) trimmed = trimmed[..MaxLabelLength];

        return new TaxSettings
        {
            Enabled = enabled,
            Rate = rate,
            PricesIncludeTax = pricesIncludeTax,
            Label = trimmed
        };
    }

    /// <summary>The effective rate applied to orders — zero when tax is disabled.</summary>
    public decimal EffectiveRate => Enabled ? Rate : 0m;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Enabled;
        yield return Rate;
        yield return PricesIncludeTax;
        yield return Label;
    }
}
