using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class CategoryName : ValueObject
{
    public string Value { get; }

    private CategoryName(string value) => Value = value;

    public static Result<CategoryName> Create(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result.Failure<CategoryName>(CatalogErrors.NameRequired);

        if (name.Length > 100)
            return Result.Failure<CategoryName>(CatalogErrors.NameTooLong);

        return Result.Success(new CategoryName(name.Trim()));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
