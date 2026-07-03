using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Ordering.Errors;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class Address : ValueObject
{
    public string Street { get; private set; } = null!; // Street address line, e.g. "King Fahd Rd, Building 12"
    public string City { get; private set; } = null!; // City name, e.g. "Riyadh"
    public string? District { get; private set; } // Optional district/neighborhood, e.g. "Al Olaya"
    public string? PostalCode { get; private set; } // Optional postal/ZIP code, e.g. "12211"
    public string Country { get; private set; } = null!; // Country name as chosen by the customer, e.g. "Saudi Arabia"; empty when not supplied
    public string? AdditionalInfo { get; private set; } // Optional extra address detail, e.g. "Apartment 5, 2nd floor"

    private Address() { }

    private Address(string street, string city, string? district, string? postalCode, string country, string? additionalInfo)
    {
        Street = street;
        City = city;
        District = district;
        PostalCode = postalCode;
        Country = country;
        AdditionalInfo = additionalInfo;
    }

    public static Result<Address> Create(
        string street,
        string city,
        string? district = null,
        string? postalCode = null,
        string? country = null,
        string? additionalInfo = null)
    {
        if (string.IsNullOrWhiteSpace(street) || string.IsNullOrWhiteSpace(city))
            return Result.Failure<Address>(OrderingErrors.InvalidAddress);

        // The country is the customer's choice — never invent one here. Callers pass it through
        // from checkout; when it's genuinely unknown we store an empty string rather than a guess.
        return Result.Success(new Address(
            street.Trim(),
            city.Trim(),
            district?.Trim(),
            postalCode?.Trim(),
            country?.Trim() ?? string.Empty,
            additionalInfo?.Trim()));
    }

    public string ToSingleLine() =>
        $"{Street}, {City}{(District != null ? $", {District}" : "")}" +
        (string.IsNullOrWhiteSpace(Country) ? "" : $", {Country}");

    public string ToMultiLine() =>
        $"{Street}\n{City}{(District != null ? $", {District}" : "")}\n{PostalCode ?? ""}" +
        (string.IsNullOrWhiteSpace(Country) ? "" : $"\n{Country}") +
        (AdditionalInfo != null ? $"\n{AdditionalInfo}" : "");

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Street;
        yield return City;
        yield return District;
        yield return PostalCode;
        yield return Country;
        yield return AdditionalInfo;
    }
}
