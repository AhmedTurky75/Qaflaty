using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.ToggleProductStatus;

public record ToggleProductStatusCommand(Guid ProductId) : ICommand;
