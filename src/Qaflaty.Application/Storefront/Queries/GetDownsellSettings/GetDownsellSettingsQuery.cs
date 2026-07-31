using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetDownsellSettings;

public record DownsellSettingsDto(
    bool Enabled, int MaxShowsPerSession, int MinIntervalSeconds, bool ExcludeOutOfStock);

public record GetDownsellSettingsQuery(StoreId StoreId) : IQuery<DownsellSettingsDto>;
