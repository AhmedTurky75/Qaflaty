using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Communication.Commands.ArchiveConversation;

public sealed record ArchiveConversationCommand(Guid ConversationId) : ICommand;
