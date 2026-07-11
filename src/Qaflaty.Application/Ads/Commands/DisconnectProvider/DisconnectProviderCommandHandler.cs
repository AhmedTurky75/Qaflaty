using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Commands.DisconnectProvider;

public class DisconnectProviderCommandHandler : ICommandHandler<DisconnectProviderCommand>
{
    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public DisconnectProviderCommandHandler(
        IProviderIntegrationRepository integrationRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _integrationRepository = integrationRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(DisconnectProviderCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        if (!await _storeRepository.CanMerchantAccessStoreAsync(_currentUserService.MerchantId ?? default, storeId, cancellationToken))
            return Result.Failure(AdsErrors.Forbidden);

        var integration = await _integrationRepository.GetByStoreAndProviderAsync(storeId, request.Provider, cancellationToken);
        if (integration == null)
            return Result.Failure(AdsErrors.ProviderNotFound);

        var result = integration.Disconnect();
        if (result.IsFailure)
            return result;

        _integrationRepository.Update(integration);
        return Result.Success();
    }
}
