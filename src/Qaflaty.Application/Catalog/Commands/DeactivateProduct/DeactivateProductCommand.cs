using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeactivateProduct;

public record DeactivateProductCommand(Guid ProductId) : ICommand;
