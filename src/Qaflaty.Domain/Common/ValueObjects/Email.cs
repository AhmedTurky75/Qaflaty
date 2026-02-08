using System.Text.RegularExpressions;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Common.ValueObjects;

public sealed partial class Email : ValueObject
{
    private const int MaxLength = 255;
    private static readonly Regex EmailRegex = GetEmailRegex();

    public string Value { get; private init; } = string.Empty;

    private Email(string value)
    {
        Value = value;
    }

    public static Result<Email> Create(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return Result.Failure<Email>(new Error("Email.Empty", "Email is required"));

        email = email.Trim().ToLowerInvariant();

        if (email.Length > MaxLength)
            return Result.Failure<Email>(new Error("Email.TooLong", $"Email must not exceed {MaxLength} characters"));

        if (!EmailRegex.IsMatch(email))
            return Result.Failure<Email>(new Error("Email.InvalidFormat", "Email format is invalid"));

        return Result.Success(new Email(email));
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase)]
    private static partial Regex GetEmailRegex();
}
