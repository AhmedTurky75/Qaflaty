using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteProduct;

public record DeleteProductCommand(Guid ProductId) : ICommand;
