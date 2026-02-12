using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.FaqItem;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.CreateFaqItem;

public class CreateFaqItemCommandHandler : ICommandHandler<CreateFaqItemCommand, FaqItemDto>
{
    private readonly IFaqItemRepository _faqItemRepository;

    public CreateFaqItemCommandHandler(IFaqItemRepository faqItemRepository)
    {
        _faqItemRepository = faqItemRepository;
    }

    public async Task<Result<FaqItemDto>> Handle(CreateFaqItemCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        // Get the max sort order to place this at the end
        var maxSortOrder = await _faqItemRepository.GetMaxSortOrderAsync(storeId, cancellationToken);
        var sortOrder = maxSortOrder + 1;

        var question = BilingualText.Create(request.Question.Arabic, request.Question.English);
        var answer = BilingualText.Create(request.Answer.Arabic, request.Answer.English);

        var faqResult = FaqItem.Create(storeId, question, answer, sortOrder, request.IsPublished);

        if (faqResult.IsFailure)
            return Result.Failure<FaqItemDto>(faqResult.Error);

        var faqItem = faqResult.Value;

        await _faqItemRepository.AddAsync(faqItem, cancellationToken);

        var dto = MapToDto(faqItem);
        return Result.Success(dto);
    }

    private static FaqItemDto MapToDto(FaqItem faqItem)
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
