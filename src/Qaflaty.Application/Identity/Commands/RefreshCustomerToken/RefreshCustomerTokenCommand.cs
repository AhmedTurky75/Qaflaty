using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.RefreshCustomerToken;

public record RefreshCustomerTokenCommand(string RefreshToken) : ICommand<CustomerAuthResponse>;
