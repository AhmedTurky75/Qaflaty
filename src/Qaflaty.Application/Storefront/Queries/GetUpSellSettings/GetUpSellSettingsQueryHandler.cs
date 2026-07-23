using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Queries.GetUpSellSettings;

public class GetUpSellSettingsQueryHandler : IQueryHandler<GetUpSellSettingsQuery, UpSellSettingsDto>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public GetUpSellSettingsQueryHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result<UpSellSettingsDto>> Handle(GetUpSellSettingsQuery request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Success(new UpSellSettingsDto(true, 4, true));

        return Result.Success(new UpSellSettingsDto(
            config.UpSellEnabled, config.UpSellLimit, config.UpSellExcludeOutOfStock));
    }
}
