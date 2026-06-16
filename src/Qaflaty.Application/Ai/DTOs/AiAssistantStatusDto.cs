namespace Qaflaty.Application.Ai.DTOs;

/// <summary>Snapshot of the AI assistant configuration and knowledge state for a store.</summary>
public sealed record AiAssistantStatusDto(
    bool Enabled,
    bool DisableHumanChat,
    bool ServiceConfigured,
    bool HasKnowledge,
    int ProductsEmbedded,
    int FaqItemsEmbedded,
    int StorePagesEmbedded,
    int TotalDocuments,
    DateTime? LastRefreshedAtUtc);
