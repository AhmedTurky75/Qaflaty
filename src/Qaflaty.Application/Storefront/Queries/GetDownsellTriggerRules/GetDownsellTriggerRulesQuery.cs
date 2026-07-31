using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetDownsellTriggerRules;

public record DownsellTriggerRuleDto(
    string TriggerType, string Surface, int? ThresholdSeconds, bool IsEnabled, int Priority);

public record GetDownsellTriggerRulesQuery(StoreId StoreId) : IQuery<IReadOnlyList<DownsellTriggerRuleDto>>;
