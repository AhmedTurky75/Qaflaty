using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.Register;

public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string? Phone
) : ICommand<AuthResponse>;
