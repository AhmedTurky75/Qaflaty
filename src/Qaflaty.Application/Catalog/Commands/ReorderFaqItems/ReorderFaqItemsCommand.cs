using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.ReorderFaqItems;

public record ReorderFaqItemsCommand(Guid StoreId, List<Guid> OrderedIds) : ICommand;
