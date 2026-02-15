using FluentValidation;

namespace Qaflaty.Application.Communication.Commands.StartConversation;

public sealed class StartConversationCommandValidator : AbstractValidator<StartConversationCommand>
{
    public StartConversationCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x)
            .Must(x => x.CustomerId.HasValue || !string.IsNullOrWhiteSpace(x.GuestSessionId))
            .WithMessage("Either CustomerId or GuestSessionId must be provided");

        RuleFor(x => x.InitialMessage)
            .MaximumLength(2000).When(x => !string.IsNullOrWhiteSpace(x.InitialMessage))
            .WithMessage("Initial message must not exceed 2000 characters");
    }
}
