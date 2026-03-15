using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Queries.GetTeamMember;

public class GetTeamMemberQueryHandler : IQueryHandler<GetTeamMemberQuery, TeamMemberDto>
{
    private readonly IMerchantRepository _merchantRepository;

    public GetTeamMemberQueryHandler(IMerchantRepository merchantRepository)
    {
        _merchantRepository = merchantRepository;
    }

    public async Task<Result<TeamMemberDto>> Handle(GetTeamMemberQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var merchantId = new MerchantId(request.MemberId);

        var merchant = await _merchantRepository.GetByIdWithAssignmentsAsync(merchantId, cancellationToken);
        if (merchant == null)
            return Result.Failure<TeamMemberDto>(IdentityErrors.MerchantNotFound);

        var assignment = merchant.StoreAssignments.FirstOrDefault(a => a.StoreId == storeId && a.IsActive);
        if (assignment == null)
            return Result.Failure<TeamMemberDto>(IdentityErrors.StoreAccessDenied);

        var dto = new TeamMemberDto(
            merchant.Id.Value,
            merchant.FullName.FullName,
            merchant.Email.Value,
            merchant.Phone?.Value,
            merchant.Username,
            merchant.IsVerified,
            assignment.Role.ToString(),
            assignment.IsActive,
            assignment.InvitedBy?.Value,
            assignment.CreatedAt,
            merchant.CreatedAt);

        return Result.Success(dto);
    }
}
