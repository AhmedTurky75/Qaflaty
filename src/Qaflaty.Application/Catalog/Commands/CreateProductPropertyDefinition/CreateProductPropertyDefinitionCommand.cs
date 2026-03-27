using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateProductPropertyDefinition;

public record CreateProductPropertyDefinitionCommand(
    Guid StoreId,
    string Name,
    string DisplayName,
    string Type,
    List<string>? Options,
    bool IsRequired,
    bool IsFilterable,
    int SortOrder
) : ICommand<ProductPropertyDefinitionDto>;
