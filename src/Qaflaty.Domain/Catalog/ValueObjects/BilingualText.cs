using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class BilingualText : ValueObject
{
    public string Arabic { get; }
    public string English { get; }

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
