using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class ProductName : ValueObject
{
    public string Value { get; }

    private ProductName(string value) => Value = value;

    public static Result<ProductName> Create(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result.Failure<ProductName>(CatalogErrors.NameRequired);

        if (name.Length > 200)
            return Result.Failure<ProductName>(CatalogErrors.NameTooLong);

        return Result.Success(new ProductName(name.Trim()));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
