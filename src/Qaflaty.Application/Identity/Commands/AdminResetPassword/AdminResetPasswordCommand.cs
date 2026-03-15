using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.AdminResetPassword;

public record AdminResetPasswordCommand(Guid StoreId, Guid MemberId, string NewPassword) : ICommand;
