using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Identity.Errors;

namespace Qaflaty.Domain.Identity.ValueObjects;

public sealed class PersonName : ValueObject
{
    public string FirstName { get; private set; } = string.Empty; // Given name (2–50 chars), e.g. "Ahmed"
    public string LastName { get; private set; } = string.Empty; // Family name (2–50 chars), e.g. "Ali"
    public string FullName => $"{FirstName} {LastName}"; // Convenience full name, e.g. "Ahmed Ali"
    public string Value => FullName; // Alias of FullName used where value objects expose a single Value

    // Parameterless constructor for EF Core
    private PersonName() { }

    private PersonName(string firstName, string lastName)
    {
        FirstName = firstName;
        LastName = lastName;
    }

    public static Result<PersonName> Create(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            return Result.Failure<PersonName>(IdentityErrors.FirstNameRequired);

        if (firstName.Trim().Length < 2 || firstName.Trim().Length > 50)
            return Result.Failure<PersonName>(IdentityErrors.FirstNameInvalidLength);

        if (string.IsNullOrWhiteSpace(lastName))
            return Result.Failure<PersonName>(IdentityErrors.LastNameRequired);

        if (lastName.Trim().Length < 2 || lastName.Trim().Length > 50)
            return Result.Failure<PersonName>(IdentityErrors.LastNameInvalidLength);

        return Result.Success(new PersonName(firstName.Trim(), lastName.Trim()));
    }

    // Overload for backward-compat — splits on first space
    public static Result<PersonName> CreateFromFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return Result.Failure<PersonName>(IdentityErrors.NameRequired);

        var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var first = parts[0];
        var last = parts.Length > 1 ? parts[1] : parts[0];
        return Create(first, last);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return FirstName;
        yield return LastName;
    }
}
