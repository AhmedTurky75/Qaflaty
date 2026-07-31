using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.ReorderCategories;

public class ReorderCategoriesCommandHandler : ICommandHandler<ReorderCategoriesCommand>
{
    private readonly ICategoryRepository _categoryRepository;

    public ReorderCategoriesCommandHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<Result> Handle(ReorderCategoriesCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var categories = await _categoryRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var byId = categories.ToDictionary(c => c.Id.Value);

        foreach (var item in request.Items)
        {
            // Ids that don't belong to this store are silently skipped rather than erroring — the
            // request is store-scoped by route, so a mismatched id is treated as not found here
            // rather than letting one client touch another store's category ranks.
            if (!byId.TryGetValue(item.CategoryId, out var category))
                continue;

            var result = category.UpdateSortOrder(item.SortOrder);
            if (result.IsFailure)
                return result;

            _categoryRepository.Update(category);
        }

        return Result.Success();
    }
}
