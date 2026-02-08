using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.ValueObjects;

public sealed class HashedPassword : ValueObject
{
    public string Value { get; }

    private HashedPassword(string value) => Value = value;

    public static HashedPassword FromHash(string hash) => new(hash);

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
