using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Communication.Commands.MarkMessagesAsRead;

public sealed record MarkMessagesAsReadCommand(
    Guid ConversationId,
    List<Guid> MessageIds,
    MessageSenderType ReaderType) : ICommand;
