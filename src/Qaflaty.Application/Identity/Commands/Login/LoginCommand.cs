using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.Login;

public record LoginCommand(
    string Email,
    string Password
) : ICommand<AuthResponse>;
