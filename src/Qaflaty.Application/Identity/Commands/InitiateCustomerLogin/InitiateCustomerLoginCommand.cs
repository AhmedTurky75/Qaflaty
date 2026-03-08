using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.Commands.InitiateMerchantLogin;

namespace Qaflaty.Application.Identity.Commands.InitiateCustomerLogin;

public record InitiateCustomerLoginCommand(string EmailOrUsername, string Password) : ICommand<InitiateLoginResponse>;
