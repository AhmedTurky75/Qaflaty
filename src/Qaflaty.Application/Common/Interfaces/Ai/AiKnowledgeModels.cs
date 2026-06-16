namespace Qaflaty.Application.Common.Interfaces.Ai;

public static class AiKnowledgeDocumentType
{
    public const string Store = "store";
    public const string Faq = "faq";
    public const string Product = "product";
}

/// <summary>
/// A single embedded chunk of store knowledge held in the in-memory vector store.
/// </summary>
public sealed record AiKnowledgeDocument(
    string Id,
    Guid StoreId,
    string Type,
    string Title,
    string Content,
    float[] Embedding,
    IReadOnlyDictionary<string, string>? Metadata = null);

public sealed record AiKnowledgeSearchResult(AiKnowledgeDocument Document, double Score);

public sealed record AiKnowledgeStoreStats(
    int ProductCount,
    int FaqCount,
    int StorePageCount,
    int TotalDocuments,
    DateTime LastRefreshedAtUtc);
