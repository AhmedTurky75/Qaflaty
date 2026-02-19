using FluentValidation;

namespace Qaflaty.Application.Communication.Commands.ArchiveConversation;

public sealed class ArchiveConversationCommandValidator : AbstractValidator<ArchiveConversationCommand>
{
    public ArchiveConversationCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required");
    }
}
