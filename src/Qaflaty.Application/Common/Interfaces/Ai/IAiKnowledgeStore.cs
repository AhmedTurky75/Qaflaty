namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// In-memory, per-store vector store for retrieval-augmented generation (RAG).
/// Documents are isolated by store id so one store can never retrieve another's data.
/// Rebuilt on demand by the "Refresh AI Knowledge" merchant action.
/// </summary>
public interface IAiKnowledgeStore
{
    /// <summary>Atomically replaces all knowledge documents for a store.</summary>
    void ReplaceStoreDocuments(Guid storeId, IReadOnlyList<AiKnowledgeDocument> documents);

    /// <summary>Returns the most similar documents for the given query embedding within a store.</summary>
    IReadOnlyList<AiKnowledgeSearchResult> Search(
        Guid storeId,
        float[] queryEmbedding,
        int topK = 5,
        double minScore = 0.2);

    bool HasKnowledge(Guid storeId);

    AiKnowledgeStoreStats? GetStats(Guid storeId);
}
