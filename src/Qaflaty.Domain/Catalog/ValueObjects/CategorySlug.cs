using System.Text.RegularExpressions;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed partial class CategorySlug : ValueObject
{
    public string Value { get; }

    private CategorySlug(string value) => Value = value;

    [GeneratedRegex(@"^[a-z0-9-]{2,50}$")]
    private static partial Regex SlugPattern();

    public static Result<CategorySlug> Create(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return Result.Failure<CategorySlug>(CatalogErrors.InvalidSlugFormat);

        slug = slug.ToLowerInvariant().Trim();

        if (!SlugPattern().IsMatch(slug))
            return Result.Failure<CategorySlug>(CatalogErrors.InvalidSlugFormat);

        return Result.Success(new CategorySlug(slug));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
