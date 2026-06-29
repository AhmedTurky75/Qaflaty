using System.Text.RegularExpressions;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed partial class StoreBranding : ValueObject
{
    public string? LogoUrl { get; } // Primary store logo URL shown in the header, e.g. "/uploads/logo.png"

    /// <summary>Alternate logo (e.g. dark mode or compact variant).</summary>
    public string? SecondaryLogoUrl { get; }

    /// <summary>Browser favicon URL (.ico or .png).</summary>
    public string? FaviconUrl { get; }

    /// <summary>Apple Touch Icon URL (180×180 PNG shown on iOS home screen).</summary>
    public string? AppleTouchIconUrl { get; }

    /// <summary>Open Graph / social share image URL (recommended 1200×630).</summary>
    public string? OgImageUrl { get; }

    public string PrimaryColor { get; } // Main brand color as a hex code, used for buttons/links, e.g. "#3B82F6"

    /// <summary>Secondary brand colour used for accents, buttons, etc.</summary>
    public string? SecondaryColor { get; }

    private StoreBranding(
        string? logoUrl,
        string? secondaryLogoUrl,
        string? faviconUrl,
        string? appleTouchIconUrl,
        string? ogImageUrl,
        string primaryColor,
        string? secondaryColor)
    {
        LogoUrl = logoUrl;
        SecondaryLogoUrl = secondaryLogoUrl;
        FaviconUrl = faviconUrl;
        AppleTouchIconUrl = appleTouchIconUrl;
        OgImageUrl = ogImageUrl;
        PrimaryColor = primaryColor;
        SecondaryColor = secondaryColor;
    }

    [GeneratedRegex(@"^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColorPattern();

    public static Result<StoreBranding> Create(
        string? logoUrl = null,
        string primaryColor = "#3B82F6",
        string? secondaryLogoUrl = null,
        string? faviconUrl = null,
        string? appleTouchIconUrl = null,
        string? ogImageUrl = null,
        string? secondaryColor = null)
    {
        if (!HexColorPattern().IsMatch(primaryColor))
            return Result.Failure<StoreBranding>(CatalogErrors.InvalidHexColor);

        if (secondaryColor != null && !HexColorPattern().IsMatch(secondaryColor))
            return Result.Failure<StoreBranding>(CatalogErrors.InvalidHexColor);

        return Result.Success(new StoreBranding(
            logoUrl, secondaryLogoUrl, faviconUrl, appleTouchIconUrl, ogImageUrl,
            primaryColor, secondaryColor));
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return LogoUrl;
        yield return SecondaryLogoUrl;
        yield return FaviconUrl;
        yield return AppleTouchIconUrl;
        yield return OgImageUrl;
        yield return PrimaryColor;
        yield return SecondaryColor;
    }
}
