using System.Text.RegularExpressions;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed partial class StoreSlug : ValueObject
{
    private static readonly string[] ReservedSlugs = ["www", "api", "admin", "app", "mail", "ftp", "smtp", "cdn", "static", "assets"];

    public string Value { get; }

    private StoreSlug(string value) => Value = value;

    [GeneratedRegex(@"^[a-z][a-z0-9-]{1,48}[a-z0-9]$")]
    private static partial Regex SlugPattern();

    public static Result<StoreSlug> Create(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return Result.Failure<StoreSlug>(CatalogErrors.InvalidSlugFormat);

        slug = slug.ToLowerInvariant().Trim();

        if (!SlugPattern().IsMatch(slug))
            return Result.Failure<StoreSlug>(CatalogErrors.InvalidSlugFormat);

        if (ReservedSlugs.Contains(slug))
            return Result.Failure<StoreSlug>(CatalogErrors.SlugReserved);

        return Result.Success(new StoreSlug(slug));
    }

    public string ToSubdomainUrl() => $"{Value}.qaflaty.com";

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
