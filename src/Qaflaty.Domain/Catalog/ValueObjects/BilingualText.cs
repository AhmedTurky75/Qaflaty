using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class BilingualText : ValueObject
{
    public string Arabic { get; } // The Arabic (ar) version of the text, e.g. "قميص قطني"
    public string English { get; } // The English (en) version of the text, e.g. "Cotton Shirt"

    private BilingualText(string arabic, string english)
    {
        Arabic = arabic;
        English = english;
    }

    public static BilingualText Create(string arabic, string english)
        => new(arabic, english);

    public static BilingualText Empty => new(string.Empty, string.Empty);

    public string GetText(string language)
        => language.Equals("ar", StringComparison.OrdinalIgnoreCase) ? Arabic : English;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Arabic;
        yield return English;
    }
}
