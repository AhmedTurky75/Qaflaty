using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateCategory;

/// <summary>
/// Updates a category's editable fields. <see cref="SortOrder"/> is optional so callers that only
/// rename a category (or the reorder endpoint, which owns ordering) leave the rank untouched.
/// </summary>
public record UpdateCategoryCommand(
    Guid CategoryId,
    string Name,
    string? NameAr,
    Guid? ParentId,
    int? SortOrder = null,
    string? ImageUrl = null,
    string? IconName = null,
    string? ContentHtml = null,
    string? ContentHtmlAr = null
) : ICommand<CategoryDto>;
