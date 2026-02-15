using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Communication.Commands.CloseConversation;

public sealed record CloseConversationCommand(Guid ConversationId) : ICommand;
