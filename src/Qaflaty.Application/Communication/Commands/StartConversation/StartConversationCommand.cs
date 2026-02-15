using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;

namespace Qaflaty.Application.Communication.Commands.StartConversation;

public sealed record StartConversationCommand(
    Guid StoreId,
    Guid? CustomerId,
    string? GuestSessionId,
    string? InitialMessage) : ICommand<ChatConversationDto>;
