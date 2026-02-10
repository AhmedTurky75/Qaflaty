using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.ActivateProduct;

public record ActivateProductCommand(Guid ProductId) : ICommand;
