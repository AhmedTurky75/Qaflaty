using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;

namespace Qaflaty.Application.Communication.Queries.GetConversations;

public sealed record GetConversationsQuery(
    Guid StoreId,
    int PageNumber = 1,
    int PageSize = 20) : IQuery<List<ConversationSummaryDto>>;
