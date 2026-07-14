using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Analytics.Queries.GetLiveMetrics;

public class GetLiveMetricsQueryHandler : IQueryHandler<GetLiveMetricsQuery, LiveMetricsDto>
{
    private readonly IPresenceTracker _presenceTracker;
    private readonly ICartRepository _cartRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeProvider _dateTimeProvider;

    public GetLiveMetricsQueryHandler(
        IPresenceTracker presenceTracker,
        ICartRepository cartRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService,
        IDateTimeProvider dateTimeProvider)
    {
        _presenceTracker = presenceTracker;
        _cartRepository = cartRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<Result<LiveMetricsDto>> Handle(GetLiveMetricsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<LiveMetricsDto>(Error.Unauthorized);

        var now = _dateTimeProvider.UtcNow;

        var activeUsers = await _presenceTracker.GetActiveUserCountAsync(storeId, now, cancellationToken);
        var productViewers = await _presenceTracker.GetProductViewerCountsAsync(storeId, now, cancellationToken);
        var activeCartCount = await _cartRepository.CountActiveCartsByStoreAsync(storeId, cancellationToken);

        return Result.Success(new LiveMetricsDto(activeUsers, activeCartCount, productViewers));
    }
}
