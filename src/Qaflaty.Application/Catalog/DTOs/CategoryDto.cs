namespace Qaflaty.Application.Catalog.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string NameAr,
    string Slug,
    Guid? ParentId,
    int SortOrder,
    int ProductCount,
    string? ImageUrl = null,
    string? IconName = null,
    string? ContentHtml = null,
    string? ContentHtmlAr = null
);

public record CategoryTreeDto(
    Guid Id,
    string Name,
    string NameAr,
    string Slug,
    List<CategoryTreeDto> Children,
    Guid? ParentId = null,
    int SortOrder = 0,
    string? ImageUrl = null,
    string? IconName = null,
    string? ContentHtml = null,
    string? ContentHtmlAr = null
);
