using System.Collections.Concurrent;
using Qaflaty.Application.Common.Interfaces.Ai;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Thread-safe, process-local vector store. Registered as a singleton so embeddings
/// survive across requests until the next "Refresh AI Knowledge" rebuild (or restart).
/// Documents are partitioned by store id to guarantee tenant isolation.
/// </summary>
public sealed class InMemoryAiKnowledgeStore : IAiKnowledgeStore
{
    private readonly ConcurrentDictionary<Guid, StoreKnowledge> _stores = new();

    public void ReplaceStoreDocuments(Guid storeId, IReadOnlyList<AiKnowledgeDocument> documents)
    {
        var knowledge = new StoreKnowledge(
            documents.ToList(),
            DateTime.UtcNow);
        _stores[storeId] = knowledge;
    }

    public IReadOnlyList<AiKnowledgeSearchResult> Search(
        Guid storeId,
        float[] queryEmbedding,
        int topK = 5,
        double minScore = 0.2)
    {
        if (queryEmbedding.Length == 0 || !_stores.TryGetValue(storeId, out var knowledge))
            return Array.Empty<AiKnowledgeSearchResult>();

        var queryNorm = Norm(queryEmbedding);
        if (queryNorm == 0)
            return Array.Empty<AiKnowledgeSearchResult>();

        return knowledge.Documents
            .Select(doc => new AiKnowledgeSearchResult(doc, CosineSimilarity(queryEmbedding, queryNorm, doc.Embedding)))
            .Where(r => r.Score >= minScore)
            .OrderByDescending(r => r.Score)
            .Take(topK)
            .ToList();
    }

    public bool HasKnowledge(Guid storeId) =>
        _stores.TryGetValue(storeId, out var k) && k.Documents.Count > 0;

    public AiKnowledgeStoreStats? GetStats(Guid storeId)
    {
        if (!_stores.TryGetValue(storeId, out var knowledge))
            return null;

        return new AiKnowledgeStoreStats(
            knowledge.Documents.Count(d => d.Type == AiKnowledgeDocumentType.Product),
            knowledge.Documents.Count(d => d.Type == AiKnowledgeDocumentType.Faq),
            knowledge.Documents.Count(d => d.Type == AiKnowledgeDocumentType.Store),
            knowledge.Documents.Count,
            knowledge.RefreshedAtUtc);
    }

    private static double CosineSimilarity(float[] query, double queryNorm, float[] candidate)
    {
        if (candidate.Length != query.Length || candidate.Length == 0)
            return 0;

        double dot = 0;
        double candidateNorm = 0;
        for (var i = 0; i < query.Length; i++)
        {
            dot += query[i] * candidate[i];
            candidateNorm += candidate[i] * candidate[i];
        }

        candidateNorm = Math.Sqrt(candidateNorm);
        if (candidateNorm == 0)
            return 0;

        return dot / (queryNorm * candidateNorm);
    }

    private static double Norm(float[] vector)
    {
        double sum = 0;
        foreach (var v in vector)
            sum += v * v;
        return Math.Sqrt(sum);
    }

    private sealed record StoreKnowledge(List<AiKnowledgeDocument> Documents, DateTime RefreshedAtUtc);
}
