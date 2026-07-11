using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Commands.VerifyProvider;

public class VerifyProviderCommandHandler : ICommandHandler<VerifyProviderCommand>
{
    private readonly IProviderVerifier _providerVerifier;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public VerifyProviderCommandHandler(
        IProviderVerifier providerVerifier,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _providerVerifier = providerVerifier;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(VerifyProviderCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        if (!await _storeRepository.CanMerchantAccessStoreAsync(_currentUserService.MerchantId ?? default, storeId, cancellationToken))
            return Result.Failure(AdsErrors.Forbidden);

        return await _providerVerifier.VerifyAsync(storeId, request.Provider, cancellationToken);
    }
}
