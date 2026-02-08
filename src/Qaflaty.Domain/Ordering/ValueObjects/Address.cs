using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Ordering.Errors;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class Address : ValueObject
{
    public string Street { get; }
    public string City { get; }
    public string? District { get; }
    public string? PostalCode { get; }
    public string Country { get; }
    public string? AdditionalInfo { get; }

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
        string country = "Saudi Arabia",
        string? additionalInfo = null)
    {
        if (string.IsNullOrWhiteSpace(street) || string.IsNullOrWhiteSpace(city))
            return Result.Failure<Address>(OrderingErrors.InvalidAddress);

        return Result.Success(new Address(
            street.Trim(),
            city.Trim(),
            district?.Trim(),
            postalCode?.Trim(),
            country.Trim(),
            additionalInfo?.Trim()));
    }

    public string ToSingleLine() => $"{Street}, {City}{(District != null ? $", {District}" : "")}, {Country}";

    public string ToMultiLine() =>
        $"{Street}\n{City}{(District != null ? $", {District}" : "")}\n{PostalCode ?? ""}\n{Country}" +
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
