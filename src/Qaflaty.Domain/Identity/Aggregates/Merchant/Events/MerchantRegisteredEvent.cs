using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant.Events;

public sealed record MerchantRegisteredEvent(
    MerchantId MerchantId,
    Email Email
) : DomainEvent;
