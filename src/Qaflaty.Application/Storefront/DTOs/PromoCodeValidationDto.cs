namespace Qaflaty.Application.Storefront.DTOs;

public record PromoCodeValidationDto(
    bool IsValid,
    string Code,
    string? DiscountType,
    decimal DiscountAmount,
    decimal Subtotal,
    bool FreeShipping,
    string? Message);
