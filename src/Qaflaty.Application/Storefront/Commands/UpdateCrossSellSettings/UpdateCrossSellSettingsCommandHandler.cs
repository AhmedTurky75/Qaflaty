using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Commands.UpdateCrossSellSettings;

public class UpdateCrossSellSettingsCommandHandler : ICommandHandler<UpdateCrossSellSettingsCommand>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public UpdateCrossSellSettingsCommandHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result> Handle(UpdateCrossSellSettingsCommand request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Failure(new Error("StoreConfiguration.NotFound", "Store configuration not found."));

        var result = config.UpdateCrossSellSettings(request.Enabled, request.Limit, request.ExcludeOutOfStock);
        if (result.IsFailure)
            return result;

        _storeConfigRepository.Update(config);
        return Result.Success();
    }
}
