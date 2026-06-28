using PhoneNumbers;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Common.ValueObjects;

public sealed class PhoneNumber : ValueObject
{
    private static readonly PhoneNumberUtil PhoneUtil = PhoneNumberUtil.GetInstance();

    /// <summary>ISO 3166-1 alpha-2 region code, e.g. "EG", "SA". Null for legacy data.</summary>
    public string? CountryCode { get; private init; }

    /// <summary>Full E.164 representation, e.g. "+201012345678".</summary>
    public string Value { get; private init; } = string.Empty;

    private PhoneNumber() { }

    /// <summary>
    /// Create a phone number with a required country code (ISO 3166-1 alpha-2).
    /// The number is validated and stored in E.164 format.
    /// </summary>
    public static Result<PhoneNumber> Create(string phone, string countryCode)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return Result.Failure<PhoneNumber>(new Error("PhoneNumber.Empty", "Phone number is required"));

        if (string.IsNullOrWhiteSpace(countryCode) || countryCode.Length != 2)
            return Result.Failure<PhoneNumber>(new Error("PhoneNumber.InvalidCountryCode",
                "A valid ISO 3166-1 alpha-2 country code is required (e.g. EG, SA, AE)"));

        var region = countryCode.ToUpperInvariant();

        try
        {
            var parsed = PhoneUtil.Parse(phone, region);

            if (!PhoneUtil.IsValidNumberForRegion(parsed, region))
                return Result.Failure<PhoneNumber>(new Error("PhoneNumber.InvalidForRegion",
                    $"Phone number is not valid for region '{region}'"));

            var e164 = PhoneUtil.Format(parsed, PhoneNumberFormat.E164);

            return Result.Success(new PhoneNumber
            {
                CountryCode = region,
                Value = e164
            });
        }
        catch (NumberParseException)
        {
            return Result.Failure<PhoneNumber>(new Error("PhoneNumber.ParseError",
                "Could not parse the phone number. Ensure the number is correct for the selected country."));
        }
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}
