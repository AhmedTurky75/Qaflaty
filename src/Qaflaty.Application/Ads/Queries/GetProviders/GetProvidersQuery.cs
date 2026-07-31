using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ads.Queries.GetProviders;

public record GetProvidersQuery(Guid StoreId) : IQuery<List<ProviderIntegrationDto>>;
