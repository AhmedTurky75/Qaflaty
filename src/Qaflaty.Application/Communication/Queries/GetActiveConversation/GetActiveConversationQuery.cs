using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;

namespace Qaflaty.Application.Communication.Queries.GetActiveConversation;

public sealed record GetActiveConversationQuery(
    Guid StoreId,
    Guid? CustomerId,
    string? GuestSessionId) : IQuery<ChatConversationDto?>;
