using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.RefreshToken;

public record RefreshTokenCommand(
    string RefreshToken
) : ICommand<AuthResponse>;
