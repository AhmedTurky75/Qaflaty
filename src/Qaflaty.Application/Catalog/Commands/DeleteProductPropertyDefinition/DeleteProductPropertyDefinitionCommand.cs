using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteProductPropertyDefinition;

public record DeleteProductPropertyDefinitionCommand(Guid DefinitionId) : ICommand;
