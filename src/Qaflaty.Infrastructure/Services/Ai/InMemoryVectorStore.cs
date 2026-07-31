using System.Collections.Concurrent;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>
/// Process-local <see cref="IVectorStore"/> used as a fallback provider (config
/// <c>VectorStore:Provider = InMemory</c>) and in tests. Chunks are partitioned by store id so a
/// search can never cross tenant boundaries; scoring mirrors <see cref="PgVectorStore"/> exactly
/// (cosine similarity with the name-weighted blend for product chunks). Not durable — lost on restart.
/// </summary>
public sealed class InMemoryVectorStore : IVectorStore
{
    private const double NameScoreWeight = 0.65;
    private const double ContentScoreWeight = 0.35;

    private readonly ConcurrentDictionary<Guid, StoreChunks> _stores = new();

    public Task ReplaceDocumentChunksAsync(
        StoreId storeId,
        KnowledgeDocumentId documentId,
        IReadOnlyList<VectorChunk> chunks,
        CancellationToken ct = default)
    {
        var store = _stores.GetOrAdd(storeId.Value, _ => new StoreChunks());
        var mapped = chunks
            .Select(c => new StoredChunk(documentId, c.DocType, c.Title, c.Content, c.Embedding, c.NameEmbedding, c.Metadata))
            .ToList();

        if (mapped.Count == 0)
            store.Documents.TryRemove(documentId.Value, out _);
        else
            store.Documents[documentId.Value] = mapped;

        store.LastUpdatedUtc = DateTime.UtcNow;
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<VectorSearchHit>> SearchAsync(
        StoreId storeId,
        float[] queryEmbedding,
        int topK = 5,
        double minScore = 0.2,
        CancellationToken ct = default)
    {
        if (queryEmbedding.Length == 0 || topK <= 0 || !_stores.TryGetValue(storeId.Value, out var store))
            return Task.FromResult<IReadOnlyList<VectorSearchHit>>(Array.Empty<VectorSearchHit>());

        var queryNorm = Norm(queryEmbedding);
        if (queryNorm == 0)
            return Task.FromResult<IReadOnlyList<VectorSearchHit>>(Array.Empty<VectorSearchHit>());

        var hits = store.Documents.Values
            .SelectMany(chunks => chunks)
            .Select(chunk => new VectorSearchHit(
                chunk.DocumentId, chunk.DocType, chunk.Title, chunk.Content, chunk.Metadata,
                ScoreChunk(queryEmbedding, queryNorm, chunk)))
            .Where(h => h.Score >= minScore)
            .OrderByDescending(h => h.Score)
            .Take(topK)
            .ToList();

        return Task.FromResult<IReadOnlyList<VectorSearchHit>>(hits);
    }

    public Task DeleteDocumentChunksAsync(StoreId storeId, KnowledgeDocumentId documentId, CancellationToken ct = default)
    {
        if (_stores.TryGetValue(storeId.Value, out var store))
        {
            store.Documents.TryRemove(documentId.Value, out _);
            store.LastUpdatedUtc = DateTime.UtcNow;
        }

        return Task.CompletedTask;
    }

    public Task DeleteStoreAsync(StoreId storeId, CancellationToken ct = default)
    {
        _stores.TryRemove(storeId.Value, out _);
        return Task.CompletedTask;
    }

    public Task<VectorStoreStats> GetStatsAsync(StoreId storeId, CancellationToken ct = default)
    {
        if (!_stores.TryGetValue(storeId.Value, out var store))
            return Task.FromResult(new VectorStoreStats(0, 0, 0, 0, 0, null));

        var all = store.Documents.Values.SelectMany(c => c).ToList();
        var stats = new VectorStoreStats(
            all.Count(c => c.DocType == AiKnowledgeDocumentType.Product),
            all.Count(c => c.DocType == AiKnowledgeDocumentType.Faq),
            all.Count(c => c.DocType == AiKnowledgeDocumentType.Store),
            all.Count(c => c.DocType == AiKnowledgeDocumentType.Upload),
            all.Count,
            all.Count == 0 ? null : store.LastUpdatedUtc);

        return Task.FromResult(stats);
    }

    private static double ScoreChunk(float[] query, double queryNorm, StoredChunk chunk)
    {
        var contentScore = CosineSimilarity(query, queryNorm, chunk.Embedding);
        if (chunk.NameEmbedding is not { Length: > 0 })
            return contentScore;

        var nameScore = CosineSimilarity(query, queryNorm, chunk.NameEmbedding);
        return NameScoreWeight * nameScore + ContentScoreWeight * contentScore;
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

    private sealed class StoreChunks
    {
        public ConcurrentDictionary<Guid, List<StoredChunk>> Documents { get; } = new();
        public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;
    }

    private sealed record StoredChunk(
        KnowledgeDocumentId DocumentId,
        string DocType,
        string Title,
        string Content,
        float[] Embedding,
        float[]? NameEmbedding,
        IReadOnlyDictionary<string, string>? Metadata);
}
