namespace Qaflaty.Application.Ai.DTOs;

public sealed record AiQuestionStatDto(string Question, int Count);

public sealed record AiProductInterestDto(Guid ProductId, string Name, int Count);

/// <summary>
/// Aggregated AI assistant analytics for the merchant dashboard (rolling 30-day window).
/// </summary>
public sealed record AiAnalyticsDto(
    int ConversationsLast30Days,
    int ConversationsToday,
    int RepliesTotal,
    int ProductsRecommended,
    int CartAdditions,
    int KnowledgeGaps,
    double ConversionRate,
    IReadOnlyList<AiQuestionStatDto> TopQuestions,
    IReadOnlyList<AiProductInterestDto> ProductInterest,
    IReadOnlyList<string> KnowledgeGapQuestions);
