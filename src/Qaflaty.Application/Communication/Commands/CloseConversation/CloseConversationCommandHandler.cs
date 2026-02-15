using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;

namespace Qaflaty.Application.Communication.Commands.CloseConversation;

public sealed class CloseConversationCommandHandler : ICommandHandler<CloseConversationCommand>
{
    private readonly IChatConversationRepository _conversationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CloseConversationCommandHandler(
        IChatConversationRepository conversationRepository,
        IUnitOfWork unitOfWork)
    {
        _conversationRepository = conversationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(CloseConversationCommand request, CancellationToken cancellationToken)
    {
        var conversationId = new ChatConversationId(request.ConversationId);

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new InvalidOperationException($"Conversation with ID {request.ConversationId} not found");

        conversation.Close();

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
