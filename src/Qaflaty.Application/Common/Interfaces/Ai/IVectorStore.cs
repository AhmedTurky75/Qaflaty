using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Common.Interfaces.Ai;

/// <summary>
/// A single embedded chunk to persist. <see cref="Embedding"/> is the full-content vector;
/// <see cref="NameEmbedding"/> is an optional second vector over a product's name alone, used for
/// the blended relevance score (weighted toward the name so an explicitly-named product outranks
/// near-identical siblings).
/// </summary>
public sealed record VectorChunk(
    KnowledgeDocumentId DocumentId,
    StoreId StoreId,
    int ChunkIndex,
    string DocType,
    string Title,
    string Content,
    float[] Embedding,
    float[]? NameEmbedding = null,
    IReadOnlyDictionary<string, string>? Metadata = null);

/// <summary>A retrieved chunk and its blended similarity score (higher = more relevant).</summary>
public sealed record VectorSearchHit(
    KnowledgeDocumentId DocumentId,
    string DocType,
    string Title,
    string Content,
    IReadOnlyDictionary<string, string>? Metadata,
    double Score);

/// <summary>Per-store knowledge counts for the merchant dashboard.</summary>
public sealed record VectorStoreStats(
    int ProductCount,
    int FaqCount,
    int StorePageCount,
    int UploadCount,
    int TotalChunks,
    DateTime? LastUpdatedUtc);

/// <summary>
/// Pluggable multi-tenant vector backend. This is the single seam a future Qdrant/Pinecone
/// implementation replaces — no other layer changes. <b>Every</b> operation is scoped to a
/// <see cref="StoreId"/>; a search must never return another tenant's vectors.
/// </summary>
public interface IVectorStore
{
    /// <summary>
    /// Atomically replaces all chunks belonging to a single document (delete existing → insert new).
    /// </summary>
    Task ReplaceDocumentChunksAsync(
        StoreId storeId,
        KnowledgeDocumentId documentId,
        IReadOnlyList<VectorChunk> chunks,
        CancellationToken ct = default);

    /// <summary>
    /// Returns the most similar chunks for the query embedding within a store. Results are filtered
    /// by <paramref name="storeId"/> (tenant isolation), by <paramref name="minScore"/>, ordered by
    /// blended score descending, and capped at <paramref name="topK"/>.
    /// </summary>
    Task<IReadOnlyList<VectorSearchHit>> SearchAsync(
        StoreId storeId,
        float[] queryEmbedding,
        int topK = 5,
        double minScore = 0.2,
        CancellationToken ct = default);

    /// <summary>Removes all chunks belonging to a document (used when the document is deleted).</summary>
    Task DeleteDocumentChunksAsync(StoreId storeId, KnowledgeDocumentId documentId, CancellationToken ct = default);

    /// <summary>Removes every chunk owned by a store (used for full reindex / rollback / tests).</summary>
    Task DeleteStoreAsync(StoreId storeId, CancellationToken ct = default);

    Task<VectorStoreStats> GetStatsAsync(StoreId storeId, CancellationToken ct = default);
}
