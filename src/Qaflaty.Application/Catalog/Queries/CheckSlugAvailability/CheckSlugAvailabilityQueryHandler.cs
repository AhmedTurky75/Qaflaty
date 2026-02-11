using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.CheckSlugAvailability;

public class CheckSlugAvailabilityQueryHandler : IQueryHandler<CheckSlugAvailabilityQuery, bool>
{
    private readonly IStoreRepository _storeRepository;

    public CheckSlugAvailabilityQueryHandler(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task<Result<bool>> Handle(CheckSlugAvailabilityQuery request, CancellationToken cancellationToken)
    {
        var slugResult = StoreSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Success(false);

        var isAvailable = await _storeRepository.IsSlugAvailableAsync(slugResult.Value, ct: cancellationToken);
        return Result.Success(isAvailable);
    }
}
