using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;

namespace Qaflaty.Application.Communication.Commands.SendChatMessage;

public sealed class SendChatMessageCommandHandler : ICommandHandler<SendChatMessageCommand, ChatMessageDto>
{
    private readonly IChatConversationRepository _conversationRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SendChatMessageCommandHandler(
        IChatConversationRepository conversationRepository,
        IUnitOfWork unitOfWork)
    {
        _conversationRepository = conversationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ChatMessageDto>> Handle(SendChatMessageCommand request, CancellationToken cancellationToken)
    {
        var conversationId = new ChatConversationId(request.ConversationId);

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new InvalidOperationException($"Conversation with ID {request.ConversationId} not found");

        var message = conversation.AddMessage(request.SenderType, request.SenderId, request.Content);

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new ChatMessageDto
        {
            Id = message.Id.Value,
            ConversationId = message.ConversationId.Value,
            SenderType = message.SenderType.ToString(),
            SenderId = message.SenderId,
            Content = message.Content,
            SentAt = message.SentAt,
            ReadAt = message.ReadAt
        });
    }
}
