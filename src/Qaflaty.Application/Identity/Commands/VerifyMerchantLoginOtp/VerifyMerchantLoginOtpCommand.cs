using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.VerifyMerchantLoginOtp;

public record VerifyMerchantLoginOtpCommand(string Email, string OtpCode) : ICommand<AuthResponse>;
