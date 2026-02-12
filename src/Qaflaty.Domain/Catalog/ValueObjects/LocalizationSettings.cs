using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class LocalizationSettings : ValueObject
{
    public string DefaultLanguage { get; private set; } = null!;
    public bool EnableBilingual { get; private set; }
    public string DefaultDirection { get; private set; } = null!;

    private LocalizationSettings() { }

    public static LocalizationSettings CreateDefault() => new()
    {
        DefaultLanguage = "ar",
        EnableBilingual = true,
        DefaultDirection = "rtl"
    };

    public static LocalizationSettings Create(
        string defaultLanguage, bool enableBilingual, string defaultDirection) => new()
    {
        DefaultLanguage = defaultLanguage,
        EnableBilingual = enableBilingual,
        DefaultDirection = defaultDirection
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return DefaultLanguage;
        yield return EnableBilingual;
        yield return DefaultDirection;
    }
}
