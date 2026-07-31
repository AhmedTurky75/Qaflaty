namespace Qaflaty.Infrastructure.Services.Ai;

public enum VectorStoreProvider
{
    PgVector,
    InMemory
}

/// <summary>
/// Binds the "VectorStore" configuration section. <see cref="Provider"/> selects the vector backend
/// (pgvector-backed PostgreSQL by default; an in-process store for local/fallback). Swapping the
/// provider is how the migration is rolled forward/back without code changes.
/// </summary>
public sealed class VectorStoreOptions
{
    public const string SectionName = "VectorStore";

    /// <summary>"PgVector" (default) or "InMemory".</summary>
    public string Provider { get; set; } = nameof(VectorStoreProvider.PgVector);

    /// <summary>
    /// Embedding vector length. Informational at runtime — the pgvector column dimension is fixed at
    /// migration time (see <c>KnowledgeChunkRecord.Dimensions</c>); changing the embedding model
    /// requires a new migration to resize the column and a full re-embed.
    /// </summary>
    public int EmbeddingDimensions { get; set; } = 768;

    public VectorStoreProvider ResolvedProvider =>
        Enum.TryParse<VectorStoreProvider>(Provider, ignoreCase: true, out var provider)
            ? provider
            : VectorStoreProvider.PgVector;
}
