namespace Qaflaty.Application.Ai.DTOs;

/// <summary>Summary returned after the merchant rebuilds the store's AI knowledge.</summary>
public sealed record AiKnowledgeRefreshResultDto(
    int ProductsEmbedded,
    int FaqItemsEmbedded,
    int StorePagesEmbedded,
    int TotalDocuments,
    DateTime CompletedAtUtc);
