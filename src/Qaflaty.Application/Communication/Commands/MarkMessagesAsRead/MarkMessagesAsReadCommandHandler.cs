using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Communication.Commands.MarkMessagesAsRead;

public sealed class MarkMessagesAsReadCommandHandler : ICommandHandler<MarkMessagesAsReadCommand>
{
    private readonly IChatConversationRepository _conversationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public MarkMessagesAsReadCommandHandler(
        IChatConversationRepository conversationRepository,
        IUnitOfWork unitOfWork)
    {
        _conversationRepository = conversationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(MarkMessagesAsReadCommand request, CancellationToken cancellationToken)
    {
        var conversationId = new ChatConversationId(request.ConversationId);

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new InvalidOperationException($"Conversation with ID {request.ConversationId} not found");

        var messageIds = request.MessageIds.Select(id => new ChatMessageId(id));

        if (request.ReaderType == MessageSenderType.Merchant)
        {
            conversation.MarkMessagesAsReadByMerchant(messageIds);
        }
        else
        {
            conversation.MarkMessagesAsReadByCustomer(messageIds);
        }

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
