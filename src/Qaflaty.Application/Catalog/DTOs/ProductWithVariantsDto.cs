namespace Qaflaty.Application.Catalog.DTOs;

public record ProductWithVariantsDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    decimal Price,
    string Currency,
    bool HasVariants,
    List<VariantOptionDto> VariantOptions,
    List<ProductVariantDto> Variants
);
