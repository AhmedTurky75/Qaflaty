using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Queries.GetCrossSellSettings;

public class GetCrossSellSettingsQueryHandler : IQueryHandler<GetCrossSellSettingsQuery, CrossSellSettingsDto>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public GetCrossSellSettingsQueryHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result<CrossSellSettingsDto>> Handle(GetCrossSellSettingsQuery request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Success(new CrossSellSettingsDto(true, 4, true));

        return Result.Success(new CrossSellSettingsDto(
            config.CrossSellEnabled, config.CrossSellLimit, config.CrossSellExcludeOutOfStock));
    }
}
