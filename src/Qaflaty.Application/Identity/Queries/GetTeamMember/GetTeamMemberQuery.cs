using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Queries.GetTeamMember;

public record GetTeamMemberQuery(Guid StoreId, Guid MemberId) : IQuery<TeamMemberDto>;
