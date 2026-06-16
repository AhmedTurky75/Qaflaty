using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;

namespace Qaflaty.Application.Ai.Commands.LogAiOrderPlaced;

public sealed class LogAiOrderPlacedCommandHandler : ICommandHandler<LogAiOrderPlacedCommand>
{
    private readonly IAiInteractionLogRepository _interactionLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LogAiOrderPlacedCommandHandler(
        IAiInteractionLogRepository interactionLogRepository,
        IUnitOfWork unitOfWork)
    {
        _interactionLogRepository = interactionLogRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(LogAiOrderPlacedCommand request, CancellationToken cancellationToken)
    {
        var log = AiInteractionLog.OrderPlaced(
            StoreId.From(request.StoreId),
            new ChatConversationId(request.ConversationId));

        await _interactionLogRepository.AddAsync(log, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
