using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.ResendMerchantLoginOtp;

public record ResendMerchantLoginOtpCommand(string Email) : ICommand;
