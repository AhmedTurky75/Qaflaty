using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.ReorderCategories;

public record CategoryOrderItem(Guid CategoryId, int SortOrder);

public record ReorderCategoriesCommand(
    Guid StoreId,
    List<CategoryOrderItem> Items
) : ICommand;
