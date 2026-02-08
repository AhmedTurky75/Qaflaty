namespace Qaflaty.Application.Catalog.DTOs;

public record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    Guid? ParentId,
    int SortOrder,
    int ProductCount
);

public record CategoryTreeDto(
    Guid Id,
    string Name,
    string Slug,
    List<CategoryTreeDto> Children
);
