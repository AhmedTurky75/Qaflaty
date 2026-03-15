using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.RemoveTeamMember;

public class RemoveTeamMemberCommandHandler : ICommandHandler<RemoveTeamMemberCommand>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;

    public RemoveTeamMemberCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(RemoveTeamMemberCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var storeId = new StoreId(request.StoreId);
        var targetMerchantId = new MerchantId(request.MemberId);

        // Cannot remove yourself
        if (_currentUserService.MerchantId.Value.Value == request.MemberId)
            return Result.Failure(new Error("Identity.CannotRemoveSelf", "You cannot remove yourself from the store"));

        var targetMerchant = await _merchantRepository.GetByIdWithAssignmentsAsync(targetMerchantId, cancellationToken);
        if (targetMerchant == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var assignment = targetMerchant.StoreAssignments
            .FirstOrDefault(a => a.StoreId == storeId && a.IsActive);

        if (assignment == null)
            return Result.Failure(IdentityErrors.StoreAccessDenied);

        // Cannot remove the Owner — the store must always have an Owner
        if (assignment.Role == MerchantRole.Owner)
            return Result.Failure(new Error("Identity.CannotRemoveOwner", "The store Owner cannot be removed"));

        targetMerchant.RemoveFromStore(storeId);
        _merchantRepository.Update(targetMerchant);

        return Result.Success();
    }
}
