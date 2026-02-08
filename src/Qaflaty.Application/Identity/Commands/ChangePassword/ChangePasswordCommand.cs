using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.ChangePassword;

public record ChangePasswordCommand(
    string CurrentPassword,
    string NewPassword
) : ICommand;
