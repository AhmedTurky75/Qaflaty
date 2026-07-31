using FluentValidation;

namespace Qaflaty.Application.Ads.Commands.SendTestEvent;

public class SendTestEventCommandValidator : AbstractValidator<SendTestEventCommand>
{
    public SendTestEventCommandValidator()
    {
        RuleFor(x => x.StoreId).NotEmpty();
        RuleFor(x => x.EventType).IsInEnum();
    }
}
