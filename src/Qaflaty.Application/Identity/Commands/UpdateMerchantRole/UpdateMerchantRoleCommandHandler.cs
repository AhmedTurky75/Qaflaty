using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.UpdateMerchantRole;

public class UpdateMerchantRoleCommandHandler : ICommandHandler<UpdateMerchantRoleCommand>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateMerchantRoleCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(UpdateMerchantRoleCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        // Verify requester has ManageMerchants permission
        var requesterRole = _currentUserService.Role;
        if (requesterRole == null ||
            (!Enum.TryParse<MerchantRole>(requesterRole, out var parsedRole) ||
             !RolePermissions.HasPermission(parsedRole, MerchantPermission.ManageMerchants)))
        {
            return Result.Failure(IdentityErrors.InsufficientPermissions);
        }

        var targetMerchantId = new MerchantId(request.MerchantId);
        var storeId = new StoreId(request.StoreId);

        var targetMerchant = await _merchantRepository.GetByIdWithAssignmentsAsync(
            targetMerchantId, cancellationToken);

        if (targetMerchant == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var assignment = targetMerchant.StoreAssignments
            .FirstOrDefault(a => a.StoreId == storeId && a.IsActive);

        if (assignment == null)
            return Result.Failure(new Error("Identity.AssignmentNotFound", "Merchant is not assigned to this store"));

        assignment.ChangeRole(request.Role);
        _merchantRepository.Update(targetMerchant);

        return Result.Success();
    }
}
