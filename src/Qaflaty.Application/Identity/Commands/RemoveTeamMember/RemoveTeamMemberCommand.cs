using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.RemoveTeamMember;

public record RemoveTeamMemberCommand(Guid StoreId, Guid MemberId) : ICommand;
