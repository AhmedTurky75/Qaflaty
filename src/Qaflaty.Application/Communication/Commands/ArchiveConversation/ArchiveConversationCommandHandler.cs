using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Communication.Commands.ArchiveConversation;

public sealed class ArchiveConversationCommandHandler : ICommandHandler<ArchiveConversationCommand>
{
    private readonly IChatConversationRepository _conversationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ArchiveConversationCommandHandler(
        IChatConversationRepository conversationRepository,
        IUnitOfWork unitOfWork)
    {
        _conversationRepository = conversationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(ArchiveConversationCommand request, CancellationToken cancellationToken)
    {
        var conversationId = new ChatConversationId(request.ConversationId);

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new InvalidOperationException($"Conversation with ID {request.ConversationId} not found");

        conversation.Archive();

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
