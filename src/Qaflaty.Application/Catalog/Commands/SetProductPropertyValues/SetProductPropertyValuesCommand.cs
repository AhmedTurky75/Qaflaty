using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.SetProductPropertyValues;

public record ProductPropertyValueRequest(Guid DefinitionId, string Value);

public record SetProductPropertyValuesCommand(
    Guid ProductId,
    List<ProductPropertyValueRequest> Values
) : ICommand<List<ProductPropertyValueDto>>;
