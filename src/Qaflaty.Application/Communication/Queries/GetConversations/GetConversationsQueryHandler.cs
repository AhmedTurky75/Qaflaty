using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;

namespace Qaflaty.Application.Communication.Queries.GetConversations;

public sealed class GetConversationsQueryHandler : IQueryHandler<GetConversationsQuery, List<ConversationSummaryDto>>
{
    private readonly IChatConversationRepository _conversationRepository;

    public GetConversationsQueryHandler(IChatConversationRepository conversationRepository)
    {
        _conversationRepository = conversationRepository;
    }

    public async Task<Result<List<ConversationSummaryDto>>> Handle(GetConversationsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var conversations = await _conversationRepository.GetConversationsByStoreAsync(
            storeId, request.PageNumber, request.PageSize, cancellationToken);

        var result = conversations.Select(c => new ConversationSummaryDto
        {
            Id = c.Id.Value,
            StoreId = c.StoreId.Value,
            CustomerId = c.CustomerId?.Value,
            GuestSessionId = c.GuestSessionId,
            Status = c.Status,
            StartedAt = c.StartedAt,
            ClosedAt = c.ClosedAt,
            LastMessageAt = c.LastMessageAt,
            UnreadMerchantMessages = c.UnreadMerchantMessages,
            UnreadCustomerMessages = c.UnreadCustomerMessages,
            LastMessage = c.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault() is { } lastMsg
                ? new ChatMessageDto
                {
                    Id = lastMsg.Id.Value,
                    ConversationId = lastMsg.ConversationId.Value,
                    SenderType = lastMsg.SenderType,
                    SenderId = lastMsg.SenderId,
                    Content = lastMsg.Content,
                    SentAt = lastMsg.SentAt,
                    ReadAt = lastMsg.ReadAt
                }
                : null
        }).ToList();

        return Result.Success(result);
    }
}
