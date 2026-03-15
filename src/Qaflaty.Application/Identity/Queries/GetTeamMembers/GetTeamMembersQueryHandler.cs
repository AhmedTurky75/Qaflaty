using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Queries.GetTeamMembers;

public class GetTeamMembersQueryHandler : IQueryHandler<GetTeamMembersQuery, List<TeamMemberDto>>
{
    private readonly IMerchantRepository _merchantRepository;

    public GetTeamMembersQueryHandler(IMerchantRepository merchantRepository)
    {
        _merchantRepository = merchantRepository;
    }

    public async Task<Result<List<TeamMemberDto>>> Handle(GetTeamMembersQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        // GetByStoreIdAsync already includes StoreAssignments (confirmed in repository implementation)
        var merchants = await _merchantRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var members = merchants
            .Select(m =>
            {
                var assignment = m.StoreAssignments.FirstOrDefault(a => a.StoreId == storeId);
                return new TeamMemberDto(
                    m.Id.Value,
                    m.FullName.FullName,
                    m.Email.Value,
                    m.Phone?.Value,
                    m.Username,
                    m.IsVerified,
                    assignment?.Role.ToString() ?? "Unknown",
                    assignment?.IsActive ?? false,
                    assignment?.InvitedBy?.Value,
                    assignment?.CreatedAt ?? m.CreatedAt,
                    m.CreatedAt);
            })
            .ToList();

        return Result.Success(members);
    }
}
