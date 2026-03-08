using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.InitiateMerchantLogin;

public record InitiateMerchantLoginCommand(string EmailOrUsername, string Password) : ICommand<InitiateLoginResponse>;

public record InitiateLoginResponse(string Email);
