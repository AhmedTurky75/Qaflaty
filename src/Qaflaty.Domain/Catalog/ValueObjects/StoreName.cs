using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class StoreName : ValueObject
{
    public string Value { get; }

    private StoreName(string value) => Value = value;

    public static Result<StoreName> Create(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result.Failure<StoreName>(CatalogErrors.NameRequired);

        if (name.Length > 100)
            return Result.Failure<StoreName>(CatalogErrors.NameTooLong);

        return Result.Success(new StoreName(name.Trim()));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
