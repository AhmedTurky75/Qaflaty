using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.SetDownsellTriggerRules;

public record DownsellTriggerRuleInput(
    string TriggerType, string Surface, int? ThresholdSeconds, bool IsEnabled, int Priority);

public record SetDownsellTriggerRulesCommand(
    StoreId StoreId,
    IReadOnlyList<DownsellTriggerRuleInput> Rules
) : ICommand;
