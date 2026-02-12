using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateFaqItem;

public class UpdateFaqItemCommandHandler : ICommandHandler<UpdateFaqItemCommand, FaqItemDto>
{
    private readonly IFaqItemRepository _faqItemRepository;

    public UpdateFaqItemCommandHandler(IFaqItemRepository faqItemRepository)
    {
        _faqItemRepository = faqItemRepository;
    }

    public async Task<Result<FaqItemDto>> Handle(UpdateFaqItemCommand request, CancellationToken cancellationToken)
    {
        var faqItemId = new FaqItemId(request.FaqItemId);
        var faqItem = await _faqItemRepository.GetByIdAsync(faqItemId, cancellationToken);

        if (faqItem == null)
            return Result.Failure<FaqItemDto>(CatalogErrors.FaqItemNotFound);

        var question = BilingualText.Create(request.Question.Arabic, request.Question.English);
        var answer = BilingualText.Create(request.Answer.Arabic, request.Answer.English);

        faqItem.Update(question, answer, request.IsPublished);

        _faqItemRepository.Update(faqItem);

        var dto = MapToDto(faqItem);
        return Result.Success(dto);
    }

    private static FaqItemDto MapToDto(Domain.Catalog.Aggregates.FaqItem.FaqItem faqItem)
    {
        return new FaqItemDto(
            faqItem.Id.Value,
            faqItem.StoreId.Value,
            new BilingualTextDto(faqItem.Question.Arabic, faqItem.Question.English),
            new BilingualTextDto(faqItem.Answer.Arabic, faqItem.Answer.English),
            faqItem.SortOrder,
            faqItem.IsPublished,
            faqItem.CreatedAt,
            faqItem.UpdatedAt);
    }
}
