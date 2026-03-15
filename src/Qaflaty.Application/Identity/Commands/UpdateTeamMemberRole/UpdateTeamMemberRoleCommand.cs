using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Application.Identity.Commands.UpdateTeamMemberRole;

public record UpdateTeamMemberRoleCommand(Guid StoreId, Guid MemberId, MerchantRole NewRole) : ICommand;
