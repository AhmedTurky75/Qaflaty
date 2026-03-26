using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.InitiateCustomerLogin;

public record InitiateCustomerLoginCommand(string EmailOrUsername, string Password) : ICommand<InitiateCustomerLoginResponse>;

public record InitiateCustomerLoginResponse(
    bool RequiresOtp,
    string Email,
    CustomerAuthResponse? AuthResponse = null
);
