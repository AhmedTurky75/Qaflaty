using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetFaqItems;

public class GetFaqItemsQueryHandler : IQueryHandler<GetFaqItemsQuery, List<FaqItemDto>>
{
    private readonly IFaqItemRepository _faqRepo;

    public GetFaqItemsQueryHandler(IFaqItemRepository faqRepo)
    {
        _faqRepo = faqRepo;
    }

    public async Task<Result<List<FaqItemDto>>> Handle(GetFaqItemsQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);

        var items = request.PublishedOnly
            ? await _faqRepo.GetPublishedByStoreIdAsync(storeId, cancellationToken)
            : await _faqRepo.GetByStoreIdAsync(storeId, cancellationToken);

        var dtos = items.Select(f => new FaqItemDto(
            f.Id.Value,
            f.StoreId.Value,
            new BilingualTextDto(f.Question.Arabic, f.Question.English),
            new BilingualTextDto(f.Answer.Arabic, f.Answer.English),
            f.SortOrder,
            f.IsPublished,
            f.CreatedAt,
            f.UpdatedAt)).ToList();

        return Result.Success(dtos);
    }
}
