using FluentValidation;

namespace Qaflaty.Application.Communication.Commands.SendChatMessage;

public sealed class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Message content is required")
            .MaximumLength(2000).WithMessage("Message must not exceed 2000 characters");

        RuleFor(x => x.SenderType)
            .IsInEnum().WithMessage("Invalid sender type");
    }
}
