using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Application.Storefront.Commands.RecordDownsellEvent;

/// <summary>
/// Records a downsell interaction (accept/dismiss/coupon redeemed/converted). Impressions are
/// recorded automatically by <c>EvaluateDownsellCommandHandler</c> and never posted here.
/// </summary>
public record RecordDownsellEventCommand(
    StoreId StoreId,
    ProductId? ProductId,
    DownsellEventType EventType,
    DownsellTriggerType? TriggerType,
    string SessionKey
) : ICommand;
