using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.UpdateTeamMemberRole;

public class UpdateTeamMemberRoleCommandHandler : ICommandHandler<UpdateTeamMemberRoleCommand>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateTeamMemberRoleCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(UpdateTeamMemberRoleCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var storeId = new StoreId(request.StoreId);
        var targetMerchantId = new MerchantId(request.MemberId);

        var targetMerchant = await _merchantRepository.GetByIdWithAssignmentsAsync(targetMerchantId, cancellationToken);
        if (targetMerchant == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var assignment = targetMerchant.StoreAssignments
            .FirstOrDefault(a => a.StoreId == storeId && a.IsActive);

        if (assignment == null)
            return Result.Failure(IdentityErrors.StoreAccessDenied);

        // Prevent demoting the current Owner — there must always be exactly one Owner
        if (assignment.Role == MerchantRole.Owner)
            return Result.Failure(new Error("Identity.CannotChangeOwnerRole", "The store Owner's role cannot be changed"));

        // Also prevent assigning Owner role through this endpoint (to avoid duplicate Owners)
        if (request.NewRole == MerchantRole.Owner)
            return Result.Failure(new Error("Identity.CannotAssignOwnerRole", "The Owner role cannot be assigned via this endpoint"));

        assignment.ChangeRole(request.NewRole);
        _merchantRepository.Update(targetMerchant);

        return Result.Success();
    }
}
