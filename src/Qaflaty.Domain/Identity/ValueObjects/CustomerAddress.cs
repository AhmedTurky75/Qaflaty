using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Identity.ValueObjects;

public sealed class CustomerAddress
{
    public Guid Id { get; private set; } // Stable identifier of this saved address entry
    public string Label { get; private set; } = string.Empty; // Friendly label chosen by the customer, e.g. "Home", "Work"
    public string Street { get; private set; } = string.Empty; // Street address line
    public string City { get; private set; } = string.Empty; // City name, e.g. "Jeddah"
    public string State { get; private set; } = string.Empty; // State/province/region (optional)
    public string PostalCode { get; private set; } = string.Empty; // Postal/ZIP code (optional)
    public string Country { get; private set; } = string.Empty; // Country name
    public bool IsDefault { get; private set; } // Whether this is the customer's default shipping address
    public decimal Latitude { get; private set; } // Map latitude of the address for geolocation/delivery
    public decimal Longitude { get; private set; } // Map longitude of the address for geolocation/delivery
    /// <summary>ISO 3166-1 numeric country code (e.g. 682 = Saudi Arabia). Matches geo-data IDs used by delivery zones.</summary>
    public int CountryCode { get; private set; } // Numeric country id linking to seeded Country geo-data
    /// <summary>City ID from the shared geo-data list. Null if zone is country-level.</summary>
    public int? CityId { get; private set; } // Numeric city id linking to seeded City geo-data
    /// <summary>District ID from the shared geo-data list. Null if zone is city- or country-level.</summary>
    public int? DistrictId { get; private set; } // Numeric district id linking to seeded District geo-data
    public bool IsDeleted { get; private set; } // Soft-delete flag; deleted addresses are hidden but retained
    public DateTime? DeletedAt { get; private set; } // UTC timestamp when the address was soft-deleted

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
        decimal longitude,
        int countryCode = 0,
        int? cityId = null,
        int? districtId = null)
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
            Longitude = longitude,
            CountryCode = countryCode,
            CityId = cityId,
            DistrictId = districtId
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
        decimal longitude,
        int countryCode = 0,
        int? cityId = null,
        int? districtId = null)
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
        CountryCode = countryCode;
        CityId = cityId;
        DistrictId = districtId;

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
