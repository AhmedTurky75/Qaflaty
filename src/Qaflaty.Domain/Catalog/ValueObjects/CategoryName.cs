using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

/// <summary>
/// A bilingual (English + Arabic) category name. The storefront renders the name for the shopper's
/// active language via <see cref="GetText"/>. <see cref="Value"/> is kept as a back-compat accessor
/// (returns English) so existing single-name call sites keep working.
/// </summary>
public sealed class CategoryName : ValueObject
{
    public const int MaxLength = 100;

    public string English { get; } // English (en) category name, e.g. "Men's Shoes"
    public string Arabic { get; }  // Arabic (ar) category name, e.g. "أحذية رجالية"

    /// <summary>Back-compatible single-name accessor; returns the English name.</summary>
    public string Value => English;

    private CategoryName(string english, string arabic)
    {
        English = english;
        Arabic = arabic;
    }

    /// <summary>
    /// Creates a bilingual category name. English is required; when Arabic is omitted/blank it
    /// falls back to the English text so the storefront never renders a blank name.
    /// </summary>
    public static Result<CategoryName> Create(string english, string? arabic = null)
    {
        if (string.IsNullOrWhiteSpace(english))
            return Result.Failure<CategoryName>(CatalogErrors.NameRequired);

        if (english.Length > MaxLength)
            return Result.Failure<CategoryName>(CatalogErrors.NameTooLong);

        var ar = string.IsNullOrWhiteSpace(arabic) ? english.Trim() : arabic.Trim();
        if (ar.Length > MaxLength)
            return Result.Failure<CategoryName>(CatalogErrors.NameTooLong);

        return Result.Success(new CategoryName(english.Trim(), ar));
    }

    /// <summary>Returns the name for the given language ("ar" → Arabic, otherwise English).</summary>
    public string GetText(string language)
        => language.Equals("ar", StringComparison.OrdinalIgnoreCase) ? Arabic : English;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return English;
        yield return Arabic;
    }
}
