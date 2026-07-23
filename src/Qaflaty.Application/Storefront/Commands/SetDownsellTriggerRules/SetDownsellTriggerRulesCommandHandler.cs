using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.SetDownsellTriggerRules;

/// <summary>
/// Replaces the store's entire trigger-rule set. The set is small and bounded (one row per
/// trigger type/surface combination), so a full replace is simpler and safer than diffing
/// individual updates.
/// </summary>
public class SetDownsellTriggerRulesCommandHandler : ICommandHandler<SetDownsellTriggerRulesCommand>
{
    private readonly IDownsellTriggerRuleRepository _ruleRepository;

    public SetDownsellTriggerRulesCommandHandler(IDownsellTriggerRuleRepository ruleRepository)
    {
        _ruleRepository = ruleRepository;
    }

    public async Task<Result> Handle(SetDownsellTriggerRulesCommand request, CancellationToken ct)
    {
        var parsed = new List<(DownsellTriggerType TriggerType, DownsellSurface Surface, int? ThresholdSeconds, bool IsEnabled, int Priority)>();

        foreach (var input in request.Rules)
        {
            if (!Enum.TryParse<DownsellTriggerType>(input.TriggerType, true, out var triggerType))
                return Result.Failure(new Error("Downsell.InvalidTriggerType", $"Unknown trigger type '{input.TriggerType}'"));

            if (!Enum.TryParse<DownsellSurface>(input.Surface, true, out var surface))
                return Result.Failure(new Error("Downsell.InvalidSurface", $"Unknown surface '{input.Surface}'"));

            parsed.Add((triggerType, surface, input.ThresholdSeconds, input.IsEnabled, input.Priority));
        }

        var existing = await _ruleRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (existing.Count > 0)
            _ruleRepository.RemoveRange(existing);

        foreach (var (triggerType, surface, thresholdSeconds, isEnabled, priority) in parsed)
        {
            var rule = DownsellTriggerRule.Create(
                request.StoreId, triggerType, surface, thresholdSeconds, isEnabled, priority);
            await _ruleRepository.AddAsync(rule, ct);
        }

        return Result.Success();
    }
}
