using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

/// <summary>
/// Bilingual (English + Arabic) rich HTML shown above the product grid when a shopper opens the
/// category in the storefront — a short intro, buying guide or promo banner authored by the merchant.
/// The markup is stored verbatim and sanitized at render time by the storefront, so nothing here
/// assumes the HTML is safe to inject blindly.
/// </summary>
public sealed class CategoryContent : ValueObject
{
    public const int MaxLength = 20_000;

    public string English { get; } // HTML rendered for shoppers browsing in English
    public string Arabic { get; }  // HTML rendered for shoppers browsing in Arabic

    private CategoryContent(string english, string arabic)
    {
        English = english;
        Arabic = arabic;
    }

    /// <summary>
    /// Creates the bilingual content block. Both languages are optional: when only one is authored
    /// the other falls back to it, and when both are blank the result is <c>null</c> (no content).
    /// </summary>
    public static Result<CategoryContent?> Create(string? english, string? arabic = null)
    {
        var en = english?.Trim() ?? string.Empty;
        var ar = arabic?.Trim() ?? string.Empty;

        if (en.Length == 0 && ar.Length == 0)
            return Result.Success<CategoryContent?>(null);

        if (en.Length > MaxLength || ar.Length > MaxLength)
            return Result.Failure<CategoryContent?>(CatalogErrors.CategoryContentTooLong);

        // A merchant who writes only one language still gets that text in both storefront languages
        // rather than an empty block.
        if (en.Length == 0) en = ar;
        if (ar.Length == 0) ar = en;

        return Result.Success<CategoryContent?>(new CategoryContent(en, ar));
    }

    /// <summary>Returns the content for the given language ("ar" → Arabic, otherwise English).</summary>
    public string GetHtml(string language)
        => language.Equals("ar", StringComparison.OrdinalIgnoreCase) ? Arabic : English;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return English;
        yield return Arabic;
    }
}
