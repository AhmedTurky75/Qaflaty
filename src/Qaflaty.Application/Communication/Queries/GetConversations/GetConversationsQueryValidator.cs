using FluentValidation;

namespace Qaflaty.Application.Communication.Queries.GetConversations;

public sealed class GetConversationsQueryValidator : AbstractValidator<GetConversationsQuery>
{
    public GetConversationsQueryValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("Page size must not exceed 100");
    }
}
