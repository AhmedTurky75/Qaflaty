using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;

namespace Qaflaty.Application.Communication.Queries.GetConversationMessages;

public sealed class GetConversationMessagesQueryHandler : IQueryHandler<GetConversationMessagesQuery, ChatConversationDto>
{
    private readonly IChatConversationRepository _conversationRepository;

    public GetConversationMessagesQueryHandler(IChatConversationRepository conversationRepository)
    {
        _conversationRepository = conversationRepository;
    }

    public async Task<Result<ChatConversationDto>> Handle(GetConversationMessagesQuery request, CancellationToken cancellationToken)
    {
        var conversationId = new ChatConversationId(request.ConversationId);

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new InvalidOperationException($"Conversation with ID {request.ConversationId} not found");

        var result = new ChatConversationDto
        {
            Id = conversation.Id.Value,
            StoreId = conversation.StoreId.Value,
            CustomerId = conversation.CustomerId?.Value,
            GuestSessionId = conversation.GuestSessionId,
            Status = conversation.Status.ToString(),
            StartedAt = conversation.StartedAt,
            ClosedAt = conversation.ClosedAt,
            LastMessageAt = conversation.LastMessageAt,
            UnreadMerchantMessages = conversation.UnreadMerchantMessages,
            UnreadCustomerMessages = conversation.UnreadCustomerMessages,
            Messages = conversation.Messages
                .OrderBy(m => m.SentAt)
                .Select(m => new ChatMessageDto
                {
                    Id = m.Id.Value,
                    ConversationId = m.ConversationId.Value,
                    SenderType = m.SenderType,
                    SenderId = m.SenderId,
                    Content = m.Content,
                    SentAt = m.SentAt,
                    ReadAt = m.ReadAt
                }).ToList()
        };

        return Result.Success(result);
    }
}
