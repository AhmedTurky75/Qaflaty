using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.VerifyOrderOtp;

public class VerifyOrderOtpCommandValidator : AbstractValidator<VerifyOrderOtpCommand>
{
    public VerifyOrderOtpCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.OrderNumber)
            .NotEmpty().WithMessage("Order number is required");

        RuleFor(x => x.OtpCode)
            .NotEmpty().WithMessage("Verification code is required")
            .Length(6).WithMessage("Verification code must be 6 digits")
            .Matches(@"^\d{6}$").WithMessage("Verification code must contain only digits");
    }
}
