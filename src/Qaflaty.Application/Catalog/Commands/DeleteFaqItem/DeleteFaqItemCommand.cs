using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteFaqItem;

public record DeleteFaqItemCommand(Guid FaqItemId) : ICommand;
