using System.Text.RegularExpressions;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed partial class ProductSlug : ValueObject
{
    public string Value { get; }

    private ProductSlug(string value) => Value = value;

    [GeneratedRegex(@"^[a-z0-9-]{3,100}$")]
    private static partial Regex SlugPattern();

    public static Result<ProductSlug> Create(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return Result.Failure<ProductSlug>(CatalogErrors.InvalidSlugFormat);

        slug = slug.ToLowerInvariant().Trim();

        if (!SlugPattern().IsMatch(slug))
            return Result.Failure<ProductSlug>(CatalogErrors.InvalidSlugFormat);

        return Result.Success(new ProductSlug(slug));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
