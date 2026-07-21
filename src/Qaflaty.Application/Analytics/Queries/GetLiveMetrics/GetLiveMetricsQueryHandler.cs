using Microsoft.Extensions.Logging;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;

// GetByIdAsync/CanMerchantAccessStoreAsync come from IStoreRepository (Catalog.Repositories);
// CountActiveCartsByStoreAsync from ICartRepository (Storefront.Repositories).

namespace Qaflaty.Application.Analytics.Queries.GetLiveMetrics;

public class GetLiveMetricsQueryHandler : IQueryHandler<GetLiveMetricsQuery, LiveMetricsDto>
{
    private readonly IPresenceTracker _presenceTracker;
    private readonly IProductViewerEnricher _productViewerEnricher;
    private readonly ICartRepository _cartRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<GetLiveMetricsQueryHandler> _logger;

    public GetLiveMetricsQueryHandler(
        IPresenceTracker presenceTracker,
        IProductViewerEnricher productViewerEnricher,
        ICartRepository cartRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService,
        IDateTimeProvider dateTimeProvider,
        ILogger<GetLiveMetricsQueryHandler> logger)
    {
        _presenceTracker = presenceTracker;
        _productViewerEnricher = productViewerEnricher;
        _cartRepository = cartRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
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
        var activeCartCount = await _cartRepository.CountActiveCartsByStoreAsync(storeId, cancellationToken);
        var rawProductViewers = await _presenceTracker.GetProductViewerCountsAsync(storeId, now, cancellationToken);
        var productViewers = await _productViewerEnricher.EnrichAsync(storeId, rawProductViewers, cancellationToken);

        // TEMP [PRESENCE-DEBUG] — remove once diagnosed. If activeUsers is 0 here but a heartbeat was
        // logged for THIS same store id, the problem is TTL/timing; if the store id differs from the
        // heartbeat's, the storefront and merchant are on different stores.
        _logger.LogInformation(
            "[PRESENCE-DEBUG] Live metrics read: store={StoreId} activeUsers={ActiveUsers} productViewers={ProductViewerCount} carts={Carts}",
            storeId.Value, activeUsers, productViewers.Count, activeCartCount);

        return Result.Success(new LiveMetricsDto(activeUsers, activeCartCount, productViewers));
    }
}
