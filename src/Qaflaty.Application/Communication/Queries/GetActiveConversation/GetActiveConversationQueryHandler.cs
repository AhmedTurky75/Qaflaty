using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;

namespace Qaflaty.Application.Communication.Queries.GetActiveConversation;

public sealed class GetActiveConversationQueryHandler : IQueryHandler<GetActiveConversationQuery, ChatConversationDto?>
{
    private readonly IChatConversationRepository _conversationRepository;

    public GetActiveConversationQueryHandler(IChatConversationRepository conversationRepository)
    {
        _conversationRepository = conversationRepository;
    }

    public async Task<ChatConversationDto?> Handle(GetActiveConversationQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        ChatConversation? conversation = null;

        if (request.CustomerId.HasValue)
        {
            var customerId = new StoreCustomerId(request.CustomerId.Value);
            conversation = await _conversationRepository.GetActiveConversationByCustomerIdAsync(
                storeId, customerId, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(request.GuestSessionId))
        {
            conversation = await _conversationRepository.GetActiveConversationByGuestSessionAsync(
                storeId, request.GuestSessionId, cancellationToken);
        }

        if (conversation is null)
        {
            return null;
        }

        return new ChatConversationDto
        {
            Id = conversation.Id.Value,
            StoreId = conversation.StoreId.Value,
            CustomerId = conversation.CustomerId?.Value,
            GuestSessionId = conversation.GuestSessionId,
            Status = conversation.Status,
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
    }
}
