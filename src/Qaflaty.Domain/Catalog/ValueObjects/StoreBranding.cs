using System.Text.RegularExpressions;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed partial class StoreBranding : ValueObject
{
    public string? LogoUrl { get; }
    public string PrimaryColor { get; }

    private StoreBranding(string? logoUrl, string primaryColor)
    {
        LogoUrl = logoUrl;
        PrimaryColor = primaryColor;
    }

    [GeneratedRegex(@"^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColorPattern();

    public static Result<StoreBranding> Create(string? logoUrl = null, string primaryColor = "#3B82F6")
    {
        if (!HexColorPattern().IsMatch(primaryColor))
            return Result.Failure<StoreBranding>(CatalogErrors.InvalidHexColor);

        return Result.Success(new StoreBranding(logoUrl, primaryColor));
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return LogoUrl;
        yield return PrimaryColor;
    }
}
