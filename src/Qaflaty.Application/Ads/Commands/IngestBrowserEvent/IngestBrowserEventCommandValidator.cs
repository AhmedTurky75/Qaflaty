using FluentValidation;

namespace Qaflaty.Application.Ads.Commands.IngestBrowserEvent;

public class IngestBrowserEventCommandValidator : AbstractValidator<IngestBrowserEventCommand>
{
    public IngestBrowserEventCommandValidator()
    {
        RuleFor(x => x.StoreId).NotEmpty();
        RuleFor(x => x.EventKey).NotEmpty();
        RuleFor(x => x.EventType).IsInEnum();
    }
}
