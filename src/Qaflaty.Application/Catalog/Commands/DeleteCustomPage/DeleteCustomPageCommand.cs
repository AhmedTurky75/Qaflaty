using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteCustomPage;

public record DeleteCustomPageCommand(Guid PageId) : ICommand;
