using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetDownsellTriggerRules;

public class GetDownsellTriggerRulesQueryHandler
    : IQueryHandler<GetDownsellTriggerRulesQuery, IReadOnlyList<DownsellTriggerRuleDto>>
{
    private readonly IDownsellTriggerRuleRepository _ruleRepository;

    public GetDownsellTriggerRulesQueryHandler(IDownsellTriggerRuleRepository ruleRepository)
    {
        _ruleRepository = ruleRepository;
    }

    public async Task<Result<IReadOnlyList<DownsellTriggerRuleDto>>> Handle(
        GetDownsellTriggerRulesQuery request, CancellationToken ct)
    {
        var rules = await _ruleRepository.GetByStoreIdAsync(request.StoreId, ct);

        var dtos = rules
            .Select(r => new DownsellTriggerRuleDto(
                r.TriggerType.ToString(), r.Surface.ToString(), r.ThresholdSeconds, r.IsEnabled, r.Priority))
            .ToList();

        return Result.Success<IReadOnlyList<DownsellTriggerRuleDto>>(dtos);
    }
}
