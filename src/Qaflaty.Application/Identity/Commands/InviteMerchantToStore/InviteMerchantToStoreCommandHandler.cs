using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.InviteMerchantToStore;

public class InviteMerchantToStoreCommandHandler : ICommandHandler<InviteMerchantToStoreCommand>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;

    public InviteMerchantToStoreCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(InviteMerchantToStoreCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var storeId = new StoreId(request.StoreId);

        // Verify requester has ManageMerchants permission for this store
        var requesterRole = _currentUserService.Role;
        if (requesterRole == null ||
            (!Enum.TryParse<MerchantRole>(requesterRole, out var parsedRole) ||
             !RolePermissions.HasPermission(parsedRole, MerchantPermission.ManageMerchants)))
        {
            return Result.Failure(IdentityErrors.InsufficientPermissions);
        }

        // Find the target merchant by email or username
        Domain.Identity.Aggregates.Merchant.Merchant? targetMerchant = null;

        var emailResult = Email.Create(request.EmailOrUsername);
        if (emailResult.IsSuccess)
        {
            targetMerchant = await _merchantRepository.GetByEmailAsync(emailResult.Value, cancellationToken);
        }

        if (targetMerchant == null)
        {
            targetMerchant = await _merchantRepository.GetByUsernameAsync(request.EmailOrUsername, cancellationToken);
        }

        if (targetMerchant == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        // Load target merchant with assignments to check existing membership
        var targetWithAssignments = await _merchantRepository.GetByIdWithAssignmentsAsync(
            targetMerchant.Id, cancellationToken);

        if (targetWithAssignments == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        if (targetWithAssignments.HasAccessToStore(storeId))
            return Result.Failure(IdentityErrors.AlreadyAssignedToStore);

        targetWithAssignments.AssignToStore(storeId, request.Role, _currentUserService.MerchantId.Value);
        _merchantRepository.Update(targetWithAssignments);

        return Result.Success();
    }
}
