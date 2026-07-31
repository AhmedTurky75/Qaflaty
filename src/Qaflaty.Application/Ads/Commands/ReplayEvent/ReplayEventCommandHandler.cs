using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Commands.ReplayEvent;

public class ReplayEventCommandHandler : ICommandHandler<ReplayEventCommand>
{
    private readonly ITrackingEventRepository _trackingEventRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IEventDispatcher _eventDispatcher;
    private readonly ICurrentUserService _currentUserService;

    public ReplayEventCommandHandler(
        ITrackingEventRepository trackingEventRepository,
        IStoreRepository storeRepository,
        IEventDispatcher eventDispatcher,
        ICurrentUserService currentUserService)
    {
        _trackingEventRepository = trackingEventRepository;
        _storeRepository = storeRepository;
        _eventDispatcher = eventDispatcher;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(ReplayEventCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        if (!await _storeRepository.CanMerchantAccessStoreAsync(_currentUserService.MerchantId ?? default, storeId, cancellationToken))
            return Result.Failure(AdsErrors.Forbidden);

        var trackingEvent = await _trackingEventRepository.GetByIdAsync(TrackingEventId.From(request.TrackingEventId), cancellationToken);
        if (trackingEvent == null || trackingEvent.StoreId != storeId)
            return Result.Failure(AdsErrors.TrackingEventNotFound);

        var replayResult = trackingEvent.ReplayDispatch(request.DispatchLogId);
        if (replayResult.IsFailure)
            return Result.Failure(replayResult.Error);

        _trackingEventRepository.Update(trackingEvent);

        await _eventDispatcher.RedispatchAsync(trackingEvent.Id, request.DispatchLogId, cancellationToken);
        return Result.Success();
    }
}
