using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;

namespace Qaflaty.Application.Communication.Queries.GetConversationMessages;

public sealed record GetConversationMessagesQuery(Guid ConversationId) : IQuery<ChatConversationDto>;
