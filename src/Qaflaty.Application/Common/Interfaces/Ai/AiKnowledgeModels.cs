namespace Qaflaty.Application.Common.Interfaces.Ai;

public static class AiKnowledgeDocumentType
{
    public const string Store = "store";
    public const string Faq = "faq";
    public const string Product = "product";
}

/// <summary>
/// A single embedded chunk of store knowledge held in the in-memory vector store.
/// <see cref="Embedding"/> is the full-content vector. <see cref="NameEmbedding"/> is an
/// optional second vector over the product name alone; when present, search blends the two
/// (weighted toward the name) so an explicitly-named product outranks near-identical siblings.
/// </summary>
public sealed record AiKnowledgeDocument(
    string Id,
    Guid StoreId,
    string Type,
    string Title,
    string Content,
    float[] Embedding,
    IReadOnlyDictionary<string, string>? Metadata = null,
    float[]? NameEmbedding = null);

public sealed record AiKnowledgeSearchResult(AiKnowledgeDocument Document, double Score);

public sealed record AiKnowledgeStoreStats(
    int ProductCount,
    int FaqCount,
    int StorePageCount,
    int TotalDocuments,
    DateTime LastRefreshedAtUtc);
