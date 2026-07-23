using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Queries.GetDownsellSettings;

public class GetDownsellSettingsQueryHandler : IQueryHandler<GetDownsellSettingsQuery, DownsellSettingsDto>
{
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public GetDownsellSettingsQueryHandler(IStoreConfigurationRepository storeConfigRepository)
    {
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result<DownsellSettingsDto>> Handle(GetDownsellSettingsQuery request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null)
            return Result.Success(new DownsellSettingsDto(false, 2, 300, true));

        return Result.Success(new DownsellSettingsDto(
            config.DownsellEnabled,
            config.DownsellMaxShowsPerSession,
            config.DownsellMinIntervalSeconds,
            config.DownsellExcludeOutOfStock));
    }
}
