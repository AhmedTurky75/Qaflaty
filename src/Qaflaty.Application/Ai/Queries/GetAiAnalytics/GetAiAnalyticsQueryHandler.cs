using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Ai.Queries.GetAiAnalytics;

public sealed class GetAiAnalyticsQueryHandler : IQueryHandler<GetAiAnalyticsQuery, AiAnalyticsDto>
{
    private const int WindowDays = 30;

    private readonly IAiInteractionLogRepository _logRepository;
    private readonly IProductRepository _productRepository;

    public GetAiAnalyticsQueryHandler(
        IAiInteractionLogRepository logRepository,
        IProductRepository productRepository)
    {
        _logRepository = logRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<AiAnalyticsDto>> Handle(GetAiAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var since = DateTime.UtcNow.AddDays(-WindowDays);
        var logs = await _logRepository.GetByStoreSinceAsync(storeId, since, cancellationToken);

        var replies = logs.Where(l => l.Type == AiInteractionType.Reply).ToList();
        var suggested = logs.Where(l => l.Type == AiInteractionType.ProductSuggested && l.ProductId.HasValue).ToList();
        var cartAdditions = logs.Count(l => l.Type == AiInteractionType.CartAdd);

        var todayUtc = DateTime.UtcNow.Date;
        var conversations30 = logs.Select(l => l.ConversationId).Distinct().Count();
        var conversationsToday = logs
            .Where(l => l.CreatedAt >= todayUtc)
            .Select(l => l.ConversationId)
            .Distinct()
            .Count();

        var knowledgeGaps = replies.Count(r => r.DocumentsRetrieved == 0);
        var conversionRate = conversations30 > 0
            ? Math.Round((double)cartAdditions / conversations30, 3)
            : 0d;

        var topQuestions = replies
            .Where(r => !string.IsNullOrWhiteSpace(r.Query))
            .GroupBy(r => r.Query!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new AiQuestionStatDto(g.Key, g.Count()))
            .OrderByDescending(q => q.Count)
            .Take(5)
            .ToList();

        var knowledgeGapQuestions = replies
            .Where(r => r.DocumentsRetrieved == 0 && !string.IsNullOrWhiteSpace(r.Query))
            .GroupBy(r => r.Query!.Trim(), StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .Take(5)
            .ToList();

        var interestGroups = suggested
            .GroupBy(s => s.ProductId!.Value)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToList();

        var productInterest = new List<AiProductInterestDto>(interestGroups.Count);
        foreach (var group in interestGroups)
        {
            var product = await _productRepository.GetByIdAsync(new ProductId(group.ProductId), cancellationToken);
            productInterest.Add(new AiProductInterestDto(
                group.ProductId,
                product?.Name.Value ?? "Unknown product",
                group.Count));
        }

        var dto = new AiAnalyticsDto(
            conversations30,
            conversationsToday,
            replies.Count,
            suggested.Count,
            cartAdditions,
            knowledgeGaps,
            conversionRate,
            topQuestions,
            productInterest,
            knowledgeGapQuestions);

        return Result.Success(dto);
    }
}
