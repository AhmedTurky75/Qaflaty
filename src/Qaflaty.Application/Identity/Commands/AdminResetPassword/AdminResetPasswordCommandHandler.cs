using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.AdminResetPassword;

public class AdminResetPasswordCommandHandler : ICommandHandler<AdminResetPasswordCommand>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;

    public AdminResetPasswordCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService,
        IPasswordHasher passwordHasher)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result> Handle(AdminResetPasswordCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        // Owners should use the standard change-password endpoint for their own password
        if (_currentUserService.MerchantId.Value.Value == request.MemberId)
            return Result.Failure(new Error("Identity.UseChangePassword", "Use the change-password endpoint to update your own password"));

        var storeId = new StoreId(request.StoreId);
        var targetMerchantId = new MerchantId(request.MemberId);

        // Verify the target merchant exists and is a member of this store
        var targetMerchant = await _merchantRepository.GetByIdWithAssignmentsAsync(targetMerchantId, cancellationToken);
        if (targetMerchant == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var assignment = targetMerchant.StoreAssignments
            .FirstOrDefault(a => a.StoreId == storeId && a.IsActive);

        if (assignment == null)
            return Result.Failure(IdentityErrors.StoreAccessDenied);

        var hashedPassword = _passwordHasher.Hash(request.NewPassword);
        var result = targetMerchant.ChangePassword(hashedPassword);
        if (result.IsFailure)
            return result;

        // Force the target's existing sessions to log out after an admin-initiated reset
        targetMerchant.RevokeAllRefreshTokens();

        _merchantRepository.Update(targetMerchant);

        return Result.Success();
    }
}
