namespace Qaflaty.Application.Catalog.DTOs;

/// <summary>
/// A selectable storefront layout option surfaced to the store builder. <see cref="Type"/> is the
/// slot name ("Header" / "Footer" / "ProductCard" / "ProductGrid") and <see cref="Code"/> is the
/// value saved on the store configuration.
/// </summary>
public record LayoutVariantDto(
    Guid Id,
    string Type,
    string Code,
    string NameEn,
    string NameAr,
    int SortOrder);
