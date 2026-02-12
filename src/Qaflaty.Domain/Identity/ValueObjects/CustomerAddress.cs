using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Identity.Errors;

namespace Qaflaty.Domain.Identity.ValueObjects;

public sealed class CustomerAddress : ValueObject
{
    public string Label { get; private init; } = string.Empty; // e.g., "Home", "Work"
    public string Street { get; private init; } = string.Empty;
    public string City { get; private init; } = string.Empty;
    public string State { get; private init; } = string.Empty;
    public string PostalCode { get; private init; } = string.Empty;
    public string Country { get; private init; } = string.Empty;
    public bool IsDefault { get; private set; }

    private CustomerAddress() { }

    public static Result<CustomerAddress> Create(
        string label,
        string street,
        string city,
        string state,
        string postalCode,
        string country,
        bool isDefault = false)
    {
        if (string.IsNullOrWhiteSpace(label))
            return Result.Failure<CustomerAddress>(
                new Error("CustomerAddress.LabelRequired", "Address label is required"));

        if (string.IsNullOrWhiteSpace(street))
            return Result.Failure<CustomerAddress>(
                new Error("CustomerAddress.StreetRequired", "Street is required"));

        if (string.IsNullOrWhiteSpace(city))
            return Result.Failure<CustomerAddress>(
                new Error("CustomerAddress.CityRequired", "City is required"));

        if (string.IsNullOrWhiteSpace(country))
            return Result.Failure<CustomerAddress>(
                new Error("CustomerAddress.CountryRequired", "Country is required"));

        return Result.Success(new CustomerAddress
        {
            Label = label.Trim(),
            Street = street.Trim(),
            City = city.Trim(),
            State = state?.Trim() ?? string.Empty,
            PostalCode = postalCode?.Trim() ?? string.Empty,
            Country = country.Trim(),
            IsDefault = isDefault
        });
    }

    public void SetAsDefault() => IsDefault = true;
    public void UnsetAsDefault() => IsDefault = false;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Label;
        yield return Street;
        yield return City;
        yield return State;
        yield return PostalCode;
        yield return Country;
    }
}
