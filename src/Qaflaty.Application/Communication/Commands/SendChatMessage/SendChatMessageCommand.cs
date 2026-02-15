using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Communication.Commands.SendChatMessage;

public sealed record SendChatMessageCommand(
    Guid ConversationId,
    MessageSenderType SenderType,
    string? SenderId,
    string Content) : ICommand<ChatMessageDto>;
