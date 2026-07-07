using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteProductLandingPage;

public record DeleteProductLandingPageCommand(Guid ProductId) : ICommand;
