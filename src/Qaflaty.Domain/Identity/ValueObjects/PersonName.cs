using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Identity.Errors;

namespace Qaflaty.Domain.Identity.ValueObjects;

public sealed class PersonName : ValueObject
{
    public string Value { get; }

    private PersonName(string value) => Value = value;

    public static Result<PersonName> Create(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result.Failure<PersonName>(IdentityErrors.NameRequired);

        if (name.Length < 2 || name.Length > 100)
            return Result.Failure<PersonName>(IdentityErrors.NameInvalidLength);

        return Result.Success(new PersonName(name.Trim()));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
