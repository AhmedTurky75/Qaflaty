using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ads.Queries.GetStorefrontTrackingConfig;

public record GetStorefrontTrackingConfigQuery(Guid StoreId) : IQuery<List<TrackingPixelConfigDto>>;
