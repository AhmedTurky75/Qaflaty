using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;

namespace Qaflaty.Application.Communication.Queries.GetChatCustomerProfile;

public record GetChatCustomerProfileQuery(Guid ConversationId) : IQuery<ChatCustomerProfileDto?>;
