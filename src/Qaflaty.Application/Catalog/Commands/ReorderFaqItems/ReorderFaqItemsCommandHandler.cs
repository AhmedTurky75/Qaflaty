using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.ReorderFaqItems;

public class ReorderFaqItemsCommandHandler : ICommandHandler<ReorderFaqItemsCommand>
{
    private readonly IFaqItemRepository _faqItemRepository;

    public ReorderFaqItemsCommandHandler(IFaqItemRepository faqItemRepository)
    {
        _faqItemRepository = faqItemRepository;
    }

    public async Task<Result> Handle(ReorderFaqItemsCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var faqItems = await _faqItemRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var sortOrder = 0;
        foreach (var faqId in request.OrderedIds)
        {
            var faqItemId = new FaqItemId(faqId);
            var faqItem = faqItems.FirstOrDefault(f => f.Id == faqItemId);

            if (faqItem != null)
            {
                faqItem.UpdateSortOrder(sortOrder);
                _faqItemRepository.Update(faqItem);
                sortOrder++;
            }
        }

        return Result.Success();
    }
}
