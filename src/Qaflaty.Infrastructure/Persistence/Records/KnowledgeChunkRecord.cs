using Pgvector;

namespace Qaflaty.Infrastructure.Persistence.Records;

/// <summary>
/// EF persistence row for an embedded knowledge chunk (the pgvector-backed vector store). This is an
/// infrastructure detail owned by <c>PgVectorStore</c> — the domain never references it, so the whole
/// vector table can be replaced by a different backend (Qdrant/Pinecone) without touching the domain.
/// </summary>
public sealed class KnowledgeChunkRecord
{
    public const int Dimensions = 768; // nomic-embed-text-v1.5 output size; must match the vector(N) column

    public Guid Id { get; set; }
    public Guid DocumentId { get; set; } // Owning knowledge_documents row (FK, cascade delete)
    public Guid StoreId { get; set; } // Denormalized tenant key — every search filters on this
    public int ChunkIndex { get; set; }
    public string DocType { get; set; } = string.Empty; // store / faq / product / upload
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Vector Embedding { get; set; } = default!; // Full-content vector
    public Vector? NameEmbedding { get; set; } // Product name-only vector (blended scoring); null otherwise
    public string? MetadataJson { get; set; } // JSON of the string→string metadata dictionary
    public DateTime CreatedAt { get; set; }
}
