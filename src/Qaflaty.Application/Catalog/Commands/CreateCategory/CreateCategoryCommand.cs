using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateCategory;

public record CreateCategoryCommand(
    Guid StoreId,
    string Name,
    string? NameAr,
    string Slug,
    Guid? ParentId,
    int SortOrder = 0,
    string? ImageUrl = null,
    string? IconName = null,
    string? ContentHtml = null,
    string? ContentHtmlAr = null
) : ICommand<CategoryDto>;
