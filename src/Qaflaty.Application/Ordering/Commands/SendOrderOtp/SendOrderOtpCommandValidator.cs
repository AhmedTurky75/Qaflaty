using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.SendOrderOtp;

public class SendOrderOtpCommandValidator : AbstractValidator<SendOrderOtpCommand>
{
    public SendOrderOtpCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.OrderNumber)
            .NotEmpty().WithMessage("Order number is required");
    }
}
