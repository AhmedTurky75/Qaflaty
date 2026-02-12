using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.DeleteFaqItem;

public class DeleteFaqItemCommandHandler : ICommandHandler<DeleteFaqItemCommand>
{
    private readonly IFaqItemRepository _faqItemRepository;

    public DeleteFaqItemCommandHandler(IFaqItemRepository faqItemRepository)
    {
        _faqItemRepository = faqItemRepository;
    }

    public async Task<Result> Handle(DeleteFaqItemCommand request, CancellationToken cancellationToken)
    {
        var faqItemId = new FaqItemId(request.FaqItemId);
        var faqItem = await _faqItemRepository.GetByIdAsync(faqItemId, cancellationToken);

        if (faqItem == null)
            return Result.Failure(CatalogErrors.FaqItemNotFound);

        _faqItemRepository.Delete(faqItem);

        return Result.Success();
    }
}
