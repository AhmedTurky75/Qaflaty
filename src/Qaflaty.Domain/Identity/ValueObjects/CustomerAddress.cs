using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Identity.ValueObjects;

public sealed class CustomerAddress
{
    public Guid Id { get; private set; }
    public string Label { get; private set; } = string.Empty;
    public string Street { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string State { get; private set; } = string.Empty;
    public string PostalCode { get; private set; } = string.Empty;
    public string Country { get; private set; } = string.Empty;
    public bool IsDefault { get; private set; }
    public decimal Latitude { get; private set; }
    public decimal Longitude { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    private CustomerAddress() { }

    public static Result<CustomerAddress> Create(
        string label,
        string street,
        string city,
        string state,
        string postalCode,
        string country,
        bool isDefault,
        decimal latitude,
        decimal longitude)
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
            Id = Guid.NewGuid(),
            Label = label.Trim(),
            Street = street.Trim(),
            City = city.Trim(),
            State = state?.Trim() ?? string.Empty,
            PostalCode = postalCode?.Trim() ?? string.Empty,
            Country = country.Trim(),
            IsDefault = isDefault,
            Latitude = latitude,
            Longitude = longitude
        });
    }

    public Result Update(
        string label,
        string street,
        string city,
        string state,
        string postalCode,
        string country,
        decimal latitude,
        decimal longitude)
    {
        if (string.IsNullOrWhiteSpace(label))
            return Result.Failure(new Error("CustomerAddress.LabelRequired", "Address label is required"));

        if (string.IsNullOrWhiteSpace(street))
            return Result.Failure(new Error("CustomerAddress.StreetRequired", "Street is required"));

        if (string.IsNullOrWhiteSpace(city))
            return Result.Failure(new Error("CustomerAddress.CityRequired", "City is required"));

        if (string.IsNullOrWhiteSpace(country))
            return Result.Failure(new Error("CustomerAddress.CountryRequired", "Country is required"));

        Label = label.Trim();
        Street = street.Trim();
        City = city.Trim();
        State = state?.Trim() ?? string.Empty;
        PostalCode = postalCode?.Trim() ?? string.Empty;
        Country = country.Trim();
        Latitude = latitude;
        Longitude = longitude;

        return Result.Success();
    }

    public void SetAsDefault() => IsDefault = true;
    public void UnsetAsDefault() => IsDefault = false;

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }
}
