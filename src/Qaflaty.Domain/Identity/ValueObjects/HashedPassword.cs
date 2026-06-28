using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.ValueObjects;

public sealed class HashedPassword : ValueObject
{
    public string Value { get; } // The stored password hash string (bcrypt); compared via IPasswordHasher, never reversible

    private HashedPassword(string value) => Value = value;

    public static HashedPassword FromHash(string hash) => new(hash);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
