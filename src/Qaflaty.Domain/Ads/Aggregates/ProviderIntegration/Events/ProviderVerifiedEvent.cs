using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ads.Aggregates.ProviderIntegration.Events;

public sealed record ProviderVerifiedEvent(ProviderIntegrationId ProviderIntegrationId, StoreId StoreId, AdProvider Provider) : DomainEvent;
