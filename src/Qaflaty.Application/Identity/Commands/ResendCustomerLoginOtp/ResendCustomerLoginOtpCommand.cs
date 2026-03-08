using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.ResendCustomerLoginOtp;

public record ResendCustomerLoginOtpCommand(string Email) : ICommand;
