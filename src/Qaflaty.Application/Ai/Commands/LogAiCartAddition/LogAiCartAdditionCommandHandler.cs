using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;

namespace Qaflaty.Application.Ai.Commands.LogAiCartAddition;

public sealed class LogAiCartAdditionCommandHandler : ICommandHandler<LogAiCartAdditionCommand>
{
    private readonly IAiInteractionLogRepository _interactionLogRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LogAiCartAdditionCommandHandler(
        IAiInteractionLogRepository interactionLogRepository,
        IUnitOfWork unitOfWork)
    {
        _interactionLogRepository = interactionLogRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(LogAiCartAdditionCommand request, CancellationToken cancellationToken)
    {
        var log = AiInteractionLog.CartAdd(
            StoreId.From(request.StoreId),
            new ChatConversationId(request.ConversationId),
            request.ProductId);

        await _interactionLogRepository.AddAsync(log, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
