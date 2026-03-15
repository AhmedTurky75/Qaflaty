using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Application.Identity.Commands.InviteTeamMember;

public record InviteTeamMemberCommand(
    Guid StoreId,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Username,
    string? Phone,
    MerchantRole Role) : ICommand<TeamMemberDto>;
