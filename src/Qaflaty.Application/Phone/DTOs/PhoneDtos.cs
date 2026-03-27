namespace Qaflaty.Application.Phone.DTOs;

public record CountryPhoneInfoDto(
    string RegionCode,
    string CountryName,
    int CallingCode,
    string NationalNumberPattern,
    string ExampleNumber
);

public record PhoneValidationResultDto(
    bool IsValid,
    string? E164Format,
    string? Error
);
