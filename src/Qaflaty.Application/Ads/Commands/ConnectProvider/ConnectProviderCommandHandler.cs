using System.Text.Json;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using ProviderIntegrationAggregate = Qaflaty.Domain.Ads.Aggregates.ProviderIntegration.ProviderIntegration;

namespace Qaflaty.Application.Ads.Commands.ConnectProvider;

public class ConnectProviderCommandHandler : ICommandHandler<ConnectProviderCommand, ProviderIntegrationDto>
{
    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICredentialProtector _credentialProtector;
    private readonly ICurrentUserService _currentUserService;

    public ConnectProviderCommandHandler(
        IProviderIntegrationRepository integrationRepository,
        IStoreRepository storeRepository,
        ICredentialProtector credentialProtector,
        ICurrentUserService currentUserService)
    {
        _integrationRepository = integrationRepository;
        _storeRepository = storeRepository;
        _credentialProtector = credentialProtector;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ProviderIntegrationDto>> Handle(ConnectProviderCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(_currentUserService.MerchantId ?? default, storeId, cancellationToken))
            return Result.Failure<ProviderIntegrationDto>(AdsErrors.Forbidden);

        var protectedJson = _credentialProtector.Protect(JsonSerializer.Serialize(request.Credentials));

        var existing = await _integrationRepository.GetByStoreAndProviderAsync(storeId, request.Provider, cancellationToken);

        ProviderIntegrationAggregate integration;
        if (existing != null)
        {
            var updateResult = existing.UpdateCredentials(protectedJson, request.BrowserTrackingEnabled, request.ServerTrackingEnabled);
            if (updateResult.IsFailure)
                return Result.Failure<ProviderIntegrationDto>(updateResult.Error);

            _integrationRepository.Update(existing);
            integration = existing;
        }
        else
        {
            var connectResult = ProviderIntegrationAggregate.Connect(
                storeId, request.Provider, protectedJson, request.BrowserTrackingEnabled, request.ServerTrackingEnabled);
            if (connectResult.IsFailure)
                return Result.Failure<ProviderIntegrationDto>(connectResult.Error);

            integration = connectResult.Value;
            await _integrationRepository.AddAsync(integration, cancellationToken);
        }

        var dto = new ProviderIntegrationDto(
            integration.Id.Value,
            integration.Provider.ToString(),
            integration.Status.ToString(),
            integration.BrowserTrackingEnabled,
            integration.ServerTrackingEnabled,
            integration.HealthScore,
            integration.LastEventAt,
            integration.LastErrorCode,
            integration.LastErrorMessage,
            integration.LastVerifiedAt,
            CredentialMasking.Mask(request.Credentials));

        return Result.Success(dto);
    }
}
