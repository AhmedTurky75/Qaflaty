using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant.Events;

public sealed record PasswordChangedEvent(
    MerchantId MerchantId
) : DomainEvent;
