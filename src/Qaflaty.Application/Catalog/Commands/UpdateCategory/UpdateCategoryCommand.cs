using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateCategory;

public record UpdateCategoryCommand(
    Guid CategoryId,
    string Name,
    Guid? ParentId
) : ICommand<CategoryDto>;
