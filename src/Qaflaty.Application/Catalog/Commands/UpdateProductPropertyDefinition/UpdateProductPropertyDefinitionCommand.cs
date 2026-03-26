using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductPropertyDefinition;

public record UpdateProductPropertyDefinitionCommand(
    Guid DefinitionId,
    string DisplayName,
    List<string>? Options,
    bool IsRequired,
    bool IsFilterable,
    int SortOrder
) : ICommand<ProductPropertyDefinitionDto>;
