namespace Qaflaty.Application.Catalog.DTOs;

public record FaqItemDto(
    Guid Id,
    Guid StoreId,
    BilingualTextDto Question,
    BilingualTextDto Answer,
    int SortOrder,
    bool IsPublished,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
