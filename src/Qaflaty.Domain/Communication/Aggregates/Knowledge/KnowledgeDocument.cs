using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Domain.Communication.Aggregates.Knowledge;

/// <summary>
/// A source of AI knowledge owned by exactly one store (tenant). A document is either a unit of
/// <em>derived</em> knowledge rebuilt from the store's own data (profile, FAQ, a product) or a file a
/// merchant <em>uploaded</em>. The document row holds metadata and processing lifecycle only; its
/// embedded chunks (vectors) are persisted behind <c>IVectorStore</c> so the vector backend
/// (pgvector today, Qdrant/Pinecone later) can be swapped without touching the domain.
/// </summary>
public sealed class KnowledgeDocument : AggregateRoot<KnowledgeDocumentId>
{
    public StoreId StoreId { get; private set; } // Owning store (tenant) this document belongs to
    public KnowledgeSourceType SourceType { get; private set; } // StoreProfile / Faq / Product / Upload
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Stable natural key for derived documents (e.g. <c>product-{id}</c>, <c>faq-{id}</c>,
    /// <c>store-info</c>) enabling idempotent upsert on refresh. Null for uploaded documents.
    /// </summary>
    public string? SourceKey { get; private set; }

    // Upload-only file metadata (null for derived documents).
    public string? OriginalFileName { get; private set; }
    public string? ContentType { get; private set; }
    public string? StoragePath { get; private set; } // Path/URL returned by IFileStorageService

    public KnowledgeDocumentStatus Status { get; private set; }
    public string? ErrorMessage { get; private set; } // Failure reason when Status == Failed
    public int ChunkCount { get; private set; } // Number of embedded chunks currently stored

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private KnowledgeDocument() { } // EF Core

    private KnowledgeDocument(
        KnowledgeDocumentId id,
        StoreId storeId,
        KnowledgeSourceType sourceType,
        string title,
        string? sourceKey,
        string? originalFileName,
        string? contentType,
        string? storagePath,
        KnowledgeDocumentStatus status,
        int chunkCount) : base(id)
    {
        StoreId = storeId;
        SourceType = sourceType;
        Title = title;
        SourceKey = sourceKey;
        OriginalFileName = originalFileName;
        ContentType = contentType;
        StoragePath = storagePath;
        Status = status;
        ChunkCount = chunkCount;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = CreatedAt;
    }

    /// <summary>Creates a derived document (rebuilt from store data). Ready immediately.</summary>
    public static KnowledgeDocument CreateDerived(
        StoreId storeId, KnowledgeSourceType sourceType, string title, string sourceKey, int chunkCount) =>
        new(KnowledgeDocumentId.New(), storeId, sourceType, title, sourceKey,
            null, null, null, KnowledgeDocumentStatus.Ready, chunkCount);

    /// <summary>Creates an uploaded document awaiting background chunking + embedding.</summary>
    public static KnowledgeDocument CreateUpload(
        StoreId storeId, string title, string originalFileName, string contentType, string storagePath) =>
        new(KnowledgeDocumentId.New(), storeId, KnowledgeSourceType.Upload, title, null,
            originalFileName, contentType, storagePath, KnowledgeDocumentStatus.Pending, 0);

    public void MarkProcessing()
    {
        Status = KnowledgeDocumentStatus.Processing;
        ErrorMessage = null;
        Touch();
    }

    public void MarkReady(int chunkCount)
    {
        Status = KnowledgeDocumentStatus.Ready;
        ChunkCount = chunkCount;
        ErrorMessage = null;
        Touch();
    }

    public void MarkFailed(string error)
    {
        Status = KnowledgeDocumentStatus.Failed;
        ErrorMessage = error;
        ChunkCount = 0;
        Touch();
    }

    /// <summary>Re-syncs a derived document's title/chunk count on refresh (idempotent upsert).</summary>
    public void SyncDerived(string title, int chunkCount)
    {
        Title = title;
        ChunkCount = chunkCount;
        Status = KnowledgeDocumentStatus.Ready;
        ErrorMessage = null;
        Touch();
    }

    private void Touch() => UpdatedAt = DateTime.UtcNow;
}
