using System.Text.RegularExpressions;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Common.ValueObjects;

public sealed partial class PhoneNumber : ValueObject
{
    private const int MinLength = 10;
    private const int MaxLength = 20;
    private static readonly Regex PhoneRegex = GetPhoneRegex();

    public string Value { get; private init; } = string.Empty;

    private PhoneNumber(string value)
    {
        Value = value;
    }

    public static Result<PhoneNumber> Create(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return Result.Failure<PhoneNumber>(new Error("PhoneNumber.Empty", "Phone number is required"));

        // Remove spaces, dashes, and parentheses
        phone = Regex.Replace(phone, @"[\s\-\(\)]", "");

        if (phone.Length < MinLength || phone.Length > MaxLength)
            return Result.Failure<PhoneNumber>(
                new Error("PhoneNumber.InvalidLength", $"Phone number must be between {MinLength} and {MaxLength} digits"));

        if (!PhoneRegex.IsMatch(phone))
            return Result.Failure<PhoneNumber>(new Error("PhoneNumber.InvalidFormat", "Phone number format is invalid"));

        return Result.Success(new PhoneNumber(phone));
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;

    [GeneratedRegex(@"^[\d+]+$", RegexOptions.Compiled)]
    private static partial Regex GetPhoneRegex();
}
