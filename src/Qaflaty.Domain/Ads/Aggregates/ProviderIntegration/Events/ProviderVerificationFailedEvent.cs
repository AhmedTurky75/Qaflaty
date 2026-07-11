using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ads.Aggregates.ProviderIntegration.Events;

public sealed record ProviderVerificationFailedEvent(
    ProviderIntegrationId ProviderIntegrationId,
    StoreId StoreId,
    AdProvider Provider,
    string ErrorMessage) : DomainEvent;
