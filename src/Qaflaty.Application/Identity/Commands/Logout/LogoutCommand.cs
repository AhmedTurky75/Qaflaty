using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.Logout;

public record LogoutCommand(
    string RefreshToken
) : ICommand;
