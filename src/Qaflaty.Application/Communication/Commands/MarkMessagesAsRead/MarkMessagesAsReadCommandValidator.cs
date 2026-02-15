using FluentValidation;

namespace Qaflaty.Application.Communication.Commands.MarkMessagesAsRead;

public sealed class MarkMessagesAsReadCommandValidator : AbstractValidator<MarkMessagesAsReadCommand>
{
    public MarkMessagesAsReadCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required");

        RuleFor(x => x.MessageIds)
            .NotEmpty().WithMessage("At least one message ID is required");

        RuleFor(x => x.ReaderType)
            .IsInEnum().WithMessage("Invalid reader type");
    }
}
