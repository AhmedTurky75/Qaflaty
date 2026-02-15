using FluentValidation;

namespace Qaflaty.Application.Communication.Queries.GetConversationMessages;

public sealed class GetConversationMessagesQueryValidator : AbstractValidator<GetConversationMessagesQuery>
{
    public GetConversationMessagesQueryValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required");
    }
}
