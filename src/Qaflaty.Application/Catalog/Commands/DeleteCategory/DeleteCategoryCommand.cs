using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteCategory;

public record DeleteCategoryCommand(Guid CategoryId) : ICommand;
