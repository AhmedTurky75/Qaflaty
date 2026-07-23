using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Commands.UpdateDownsellSettings;

public class UpdateDownsellSettingsCommandHandler : ICommandHandler<UpdateDownsellSettingsCommand>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public UpdateDownsellSettingsCommandHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result> Handle(UpdateDownsellSettingsCommand request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Failure(new Error("StoreConfiguration.NotFound", "Store configuration not found."));

        var result = config.UpdateDownsellSettings(
            request.Enabled, request.MaxShowsPerSession, request.MinIntervalSeconds, request.ExcludeOutOfStock);
        if (result.IsFailure)
            return result;

        _storeConfigRepository.Update(config);
        return Result.Success();
    }
}
