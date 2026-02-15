using FluentValidation;

namespace Qaflaty.Application.Communication.Queries.GetActiveConversation;

public sealed class GetActiveConversationQueryValidator : AbstractValidator<GetActiveConversationQuery>
{
    public GetActiveConversationQueryValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x)
            .Must(x => x.CustomerId.HasValue || !string.IsNullOrWhiteSpace(x.GuestSessionId))
            .WithMessage("Either CustomerId or GuestSessionId must be provided");
    }
}
