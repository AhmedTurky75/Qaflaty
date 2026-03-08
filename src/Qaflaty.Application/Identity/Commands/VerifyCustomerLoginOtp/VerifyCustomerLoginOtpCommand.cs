using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.VerifyCustomerLoginOtp;

public record VerifyCustomerLoginOtpCommand(string Email, string OtpCode) : ICommand<CustomerAuthResponse>;
