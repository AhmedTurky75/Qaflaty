using Microsoft.AspNetCore.Http;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.SelectStore;

public class SelectStoreCommandHandler : ICommandHandler<SelectStoreCommand, SelectStoreResult>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITokenService _tokenService;
    private readonly ICookieAuthService _cookieAuthService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public SelectStoreCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService,
        ITokenService tokenService,
        ICookieAuthService cookieAuthService,
        IHttpContextAccessor httpContextAccessor)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
        _tokenService = tokenService;
        _cookieAuthService = cookieAuthService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<SelectStoreResult>> Handle(SelectStoreCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure<SelectStoreResult>(IdentityErrors.MerchantNotFound);

        var merchant = await _merchantRepository.GetByIdWithAssignmentsAsync(
            _currentUserService.MerchantId.Value, cancellationToken);

        if (merchant == null)
            return Result.Failure<SelectStoreResult>(IdentityErrors.MerchantNotFound);

        var storeId = new StoreId(request.StoreId);

        if (!merchant.HasAccessToStore(storeId))
            return Result.Failure<SelectStoreResult>(IdentityErrors.StoreAccessDenied);

        var role = merchant.GetRoleForStore(storeId);
        if (role == null)
            return Result.Failure<SelectStoreResult>(IdentityErrors.StoreAccessDenied);

        var permissions = RolePermissions.GetPermissions(role.Value);
        var permissionNames = Enum.GetValues<MerchantPermission>()
            .Where(p => p != MerchantPermission.None && permissions.HasFlag(p))
            .Select(p => p.ToString())
            .ToList();

        var accessToken = _tokenService.GenerateMerchantAccessToken(merchant, storeId, role.Value);
        var refreshToken = _tokenService.GenerateRefreshToken();

        if (_httpContextAccessor.HttpContext != null)
            _cookieAuthService.SetAuthCookies(_httpContextAccessor.HttpContext, accessToken, refreshToken);

        return Result.Success(new SelectStoreResult(request.StoreId, role.Value.ToString(), permissionNames));
    }
}
