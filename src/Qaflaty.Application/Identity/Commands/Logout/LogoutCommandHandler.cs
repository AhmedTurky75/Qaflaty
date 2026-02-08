using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.Logout;

public class LogoutCommandHandler : ICommandHandler<LogoutCommand>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;

    public LogoutCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        var merchant = await _merchantRepository.GetByIdAsync(_currentUserService.MerchantId.Value, cancellationToken);
        if (merchant == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        // Revoke the refresh token
        merchant.RevokeRefreshToken(request.RefreshToken);

        _merchantRepository.Update(merchant);

        return Result.Success();
    }
}
