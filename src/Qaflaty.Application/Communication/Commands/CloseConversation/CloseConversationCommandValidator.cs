using FluentValidation;

namespace Qaflaty.Application.Communication.Commands.CloseConversation;

public sealed class CloseConversationCommandValidator : AbstractValidator<CloseConversationCommand>
{
    public CloseConversationCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required");
    }
}
