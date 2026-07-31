using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Domain.Communication.Aggregates.Knowledge;

/// <summary>
/// Persistence for <see cref="KnowledgeDocument"/> metadata. Every query is tenant-scoped by
/// <see cref="StoreId"/>; a document is only ever reachable through its owning store.
/// </summary>
public interface IKnowledgeDocumentRepository
{
    Task AddAsync(KnowledgeDocument document, CancellationToken ct = default);

    void Update(KnowledgeDocument document);

    void Delete(KnowledgeDocument document);

    /// <summary>Loads a single document, scoped to the owning store (returns null on tenant mismatch).</summary>
    Task<KnowledgeDocument?> GetByIdAsync(StoreId storeId, KnowledgeDocumentId id, CancellationToken ct = default);

    Task<IReadOnlyList<KnowledgeDocument>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default);

    /// <summary>Derived documents for a store (excludes uploads) — used to reconcile on refresh.</summary>
    Task<IReadOnlyList<KnowledgeDocument>> GetDerivedByStoreAsync(StoreId storeId, CancellationToken ct = default);

    /// <summary>Documents of a store filtered by source type (e.g. all uploads).</summary>
    Task<IReadOnlyList<KnowledgeDocument>> GetByStoreAndSourceAsync(
        StoreId storeId, KnowledgeSourceType sourceType, CancellationToken ct = default);
}
