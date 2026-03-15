using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Queries.GetTeamMembers;

public record GetTeamMembersQuery(Guid StoreId) : IQuery<List<TeamMemberDto>>;
