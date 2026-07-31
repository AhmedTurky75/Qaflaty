using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Commands.UpdateUpSellSettings;

public class UpdateUpSellSettingsCommandHandler : ICommandHandler<UpdateUpSellSettingsCommand>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public UpdateUpSellSettingsCommandHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result> Handle(UpdateUpSellSettingsCommand request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Failure(new Error("StoreConfiguration.NotFound", "Store configuration not found."));

        var result = config.UpdateUpSellSettings(request.Enabled, request.Limit, request.ExcludeOutOfStock);
        if (result.IsFailure)
            return result;

        _storeConfigRepository.Update(config);
        return Result.Success();
    }
}
