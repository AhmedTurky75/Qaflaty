using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.RecordDownsellEvent;

public class RecordDownsellEventCommandHandler : ICommandHandler<RecordDownsellEventCommand>
{
    private readonly IDownsellEventRepository _eventRepository;

    public RecordDownsellEventCommandHandler(IDownsellEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<Result> Handle(RecordDownsellEventCommand request, CancellationToken ct)
    {
        // Impressions are only ever recorded by EvaluateDownsellCommandHandler, alongside the
        // frequency-cap check — accepting them here would let a client inflate its own impression
        // count (or bypass the cap) without the server ever having decided to show anything.
        if (request.EventType == DownsellEventType.Impression)
            return Result.Failure(new Error(
                "Downsell.ImpressionNotAllowed", "Impressions are recorded by the evaluate endpoint only."));

        var downsellEvent = DownsellEvent.Create(
            request.StoreId, request.ProductId, request.EventType, request.TriggerType, request.SessionKey);

        await _eventRepository.AddAsync(downsellEvent, ct);
        return Result.Success();
    }
}
